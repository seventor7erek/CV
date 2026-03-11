// DISABLED: DB and webhook modules — site operates on ad revenue only.
// To re-enable: uncomment the mod declarations and the disabled code blocks below.
// #[cfg(feature = "server")]
// mod db;
// #[cfg(feature = "server")]
// mod webhook;

/// Sonic Converter API Server — minimal health-check mode.
///
/// API/DB functionality is disabled. The site operates on ad revenue only.
/// To re-enable full API: uncomment disabled sections and restore full
/// server feature in Cargo.toml.

#[cfg(feature = "server")]
use axum::{
    extract::State,
    http::{header, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
    Router,
};
#[cfg(feature = "server")]
use serde_json::json;
use tracing::info;

// DISABLED: Unused imports for API/DB functionality
// #[cfg(feature = "server")]
// use axum::{
//     body::Body,
//     extract::Multipart,
//     http::HeaderMap,
//     response::IntoResponse,
//     routing::post,
// };
// #[cfg(feature = "server")]
// use dashmap::DashMap;
// #[cfg(feature = "server")]
// use governor::{Quota, RateLimiter};
// #[cfg(feature = "server")]
// use std::collections::HashMap;
// #[cfg(feature = "server")]
// use std::num::NonZeroU32;
// #[cfg(feature = "server")]
// use std::sync::Arc;
// #[cfg(feature = "server")]
// use std::time::Instant;
// #[cfg(feature = "server")]
// use tokio::io::AsyncWriteExt;
// #[cfg(feature = "server")]
// use tokio_util::io::ReaderStream;
// #[cfg(feature = "server")]
// use tower_http::limit::RequestBodyLimitLayer;
// #[cfg(feature = "server")]
// use chrono::Datelike;
// use tracing::{error, warn};

#[cfg(feature = "server")]
use tower_http::cors::CorsLayer;

// ---------------------------------------------------------------------------
// Minimal application state (no DB, no API keys, no rate limiting)
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
#[derive(Clone)]
struct AppState;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
#[tokio::main]
async fn main() {
    // --- Structured logging ------------------------------------------------
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .json()
        .init();

    // --- CORS (strict) -----------------------------------------------------
    let allowed_origins_raw = std::env::var("SONIC_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "https://mp3towav.online,https://www.mp3towav.online,http://localhost:3000".to_string());

    let origins: Vec<header::HeaderValue> = allowed_origins_raw
        .split(',')
        .filter_map(|o| o.trim().parse().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET])
        .allow_headers([header::CONTENT_TYPE]);

    let state = AppState;

    // --- Router (health check only) ----------------------------------------
    let app = Router::new()
        .route("/", get(health))
        .route("/health", get(health))
        // DISABLED: API endpoints
        // .route("/v1/status", get(status_handler))
        // .nest("/v1", protected)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(cors)
        .with_state(state);

    let addr = std::env::var("SONIC_ADDR").or_else(|_| {
        std::env::var("PORT").map(|p| format!("0.0.0.0:{p}"))
    }).unwrap_or_else(|_| "0.0.0.0:3001".to_string());

    info!(addr = %addr, "Sonic Converter starting (API disabled — health check only)");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}

#[cfg(not(feature = "server"))]
fn main() {
    eprintln!("Server feature not enabled. Build with: cargo run --features server");
    std::process::exit(1);
}

// ---------------------------------------------------------------------------
// Middleware: Security headers on all responses
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
async fn security_headers_middleware(
    request: axum::extract::Request,
    next: Next,
) -> Response {
    let request_id = uuid::Uuid::new_v4().to_string();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();

    headers.insert("X-Request-Id", HeaderValue::from_str(&request_id).unwrap());
    headers.insert("X-Content-Type-Options", HeaderValue::from_static("nosniff"));
    headers.insert("Strict-Transport-Security", HeaderValue::from_static("max-age=63072000; includeSubDomains; preload"));
    headers.insert("X-Frame-Options", HeaderValue::from_static("DENY"));
    headers.insert("Referrer-Policy", HeaderValue::from_static("strict-origin-when-cross-origin"));
    headers.insert("Permissions-Policy", HeaderValue::from_static("camera=(), microphone=(), geolocation=()"));

    response
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "engine": "sonic-converter",
        "version": env!("CARGO_PKG_VERSION"),
        "mode": "health-check-only",
    }))
}

// ===========================================================================
// DISABLED: All API/DB functionality below.
// To re-enable: uncomment everything below, restore mod db/webhook above,
// restore full server feature in Cargo.toml, and rebuild.
// ===========================================================================

/*

/// Wrapper to pass the raw API key through request extensions.
#[cfg(feature = "server")]
#[derive(Clone)]
struct ApiKey(String);

// ---------------------------------------------------------------------------
// Subscription tiers
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
#[derive(Clone, Debug, PartialEq, Eq)]
enum Tier {
    Free,
    Pro,
    Business,
    Unlimited,
}

#[cfg(feature = "server")]
impl Tier {
    fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "free" => Some(Tier::Free),
            "pro" => Some(Tier::Pro),
            "business" => Some(Tier::Business),
            "unlimited" => Some(Tier::Unlimited),
            _ => None,
        }
    }

    /// Maximum upload size in bytes for this tier.
    fn max_file_size(&self) -> u64 {
        match self {
            Tier::Free => 100 * 1024 * 1024,           // 100 MB
            Tier::Pro => 500 * 1024 * 1024,             // 500 MB
            Tier::Business => 2 * 1024 * 1024 * 1024,   // 2 GB
            Tier::Unlimited => 5 * 1024 * 1024 * 1024,   // 5 GB
        }
    }

    /// Human-readable file size limit.
    fn max_file_size_label(&self) -> &'static str {
        match self {
            Tier::Free => "100 MB",
            Tier::Pro => "500 MB",
            Tier::Business => "2 GB",
            Tier::Unlimited => "5 GB",
        }
    }

    /// Allowed bit depths for this tier.
    fn allowed_bit_depths(&self) -> &'static [u8] {
        match self {
            Tier::Free => &[16],
            Tier::Pro => &[16, 24],
            Tier::Business | Tier::Unlimited => &[16, 24, 32],
        }
    }

    fn name(&self) -> &'static str {
        match self {
            Tier::Free => "Free",
            Tier::Pro => "Pro",
            Tier::Business => "Business",
            Tier::Unlimited => "Unlimited",
        }
    }

    /// Requests per minute allowed for this tier.
    fn requests_per_minute(&self) -> u32 {
        match self {
            Tier::Free => 10,
            Tier::Pro => 50,
            Tier::Business => 200,
            Tier::Unlimited => 500,
        }
    }

    /// Monthly conversion limit (None = unlimited).
    fn monthly_limit(&self) -> Option<u32> {
        match self {
            Tier::Free => Some(500),
            Tier::Pro => Some(5000),
            Tier::Business => Some(25000),
            Tier::Unlimited => None,
        }
    }
}

// ---------------------------------------------------------------------------
// Rate limiter (per API key)
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
type KeyRateLimiter = RateLimiter<
    governor::state::NotKeyed,
    governor::state::InMemoryState,
    governor::clock::DefaultClock,
>;

#[cfg(feature = "server")]
#[derive(Clone)]
struct RateLimiterMap {
    limiters: Arc<DashMap<String, Arc<KeyRateLimiter>>>,
}

#[cfg(feature = "server")]
impl RateLimiterMap {
    fn new() -> Self {
        Self {
            limiters: Arc::new(DashMap::new()),
        }
    }

    fn check(&self, key: &str, tier: &Tier) -> Result<(), ()> {
        let limiter = self
            .limiters
            .entry(key.to_string())
            .or_insert_with(|| {
                let rpm = tier.requests_per_minute();
                let quota = Quota::per_minute(NonZeroU32::new(rpm).unwrap());
                Arc::new(RateLimiter::direct(quota))
            })
            .clone();

        limiter.check().map_err(|_| ())
    }
}

// ---------------------------------------------------------------------------
// Shared application state (full API mode)
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
#[derive(Clone)]
struct FullAppState {
    /// Maps API key → tier.
    api_keys: HashMap<String, Tier>,
    /// Per-key rate limiters.
    rate_limiters: RateLimiterMap,
    /// Database connection (optional).
    database: Option<db::Database>,
}

// ---------------------------------------------------------------------------
// Middleware: API key authentication + rate limiting
// ---------------------------------------------------------------------------
#[cfg(feature = "server")]
async fn auth_middleware(
    State(state): State<FullAppState>,
    headers: HeaderMap,
    mut request: axum::extract::Request,
    next: Next,
) -> Response {
    let key = headers
        .get("x-api-key")
        .and_then(|v| v.to_str().ok())
        .map(|k| k.to_string())
        .or_else(|| {
            headers
                .get(header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "))
                .map(|k| k.to_string())
        });

    let key = match key {
        Some(k) => k,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "error": "unauthorized",
                    "message": "Missing API key.",
                    "status": 401
                })),
            )
                .into_response();
        }
    };

    match state.api_keys.get(&key) {
        Some(tier) => {
            if let Err(_) = state.rate_limiters.check(&key, tier) {
                return (
                    StatusCode::TOO_MANY_REQUESTS,
                    Json(json!({
                        "error": "rate_limited",
                        "message": "Rate limit exceeded.",
                        "status": 429
                    })),
                )
                    .into_response();
            }

            if let Some(ref db) = state.database {
                if let Some(limit) = tier.monthly_limit() {
                    match db.get_monthly_usage(&key).await {
                        Ok(usage) => {
                            if usage.conversion_count >= limit {
                                return (
                                    StatusCode::TOO_MANY_REQUESTS,
                                    Json(json!({
                                        "error": "quota_exceeded",
                                        "message": "Monthly limit reached.",
                                        "status": 429
                                    })),
                                )
                                    .into_response();
                            }
                        }
                        Err(_) => {}
                    }
                }
            }

            request.extensions_mut().insert::<Tier>(tier.clone());
            request.extensions_mut().insert::<ApiKey>(ApiKey(key.clone()));
            next.run(request).await
        }
        None => {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "error": "invalid_api_key",
                    "message": "The provided API key is not valid.",
                    "status": 401
                })),
            )
                .into_response()
        }
    }
}

/// Readiness probe — includes database connectivity check.
#[cfg(feature = "server")]
async fn status_handler(State(state): State<FullAppState>) -> Response {
    let db_status = if let Some(ref db) = state.database {
        match db.get_monthly_usage("__health_check__").await {
            Ok(_) => "connected",
            Err(_) => "error",
        }
    } else {
        "not_configured"
    };

    let status_code = if db_status == "error" {
        StatusCode::SERVICE_UNAVAILABLE
    } else {
        StatusCode::OK
    };

    (
        status_code,
        Json(json!({
            "status": if status_code == StatusCode::OK { "ok" } else { "degraded" },
            "engine": "sonic-converter",
            "version": env!("CARGO_PKG_VERSION"),
            "database": db_status,
        })),
    )
        .into_response()
}

/// Returns usage data for the authenticated API key.
#[cfg(feature = "server")]
async fn usage_handler(
    axum::Extension(tier): axum::Extension<Tier>,
    axum::Extension(api_key): axum::Extension<ApiKey>,
    State(state): State<FullAppState>,
) -> Response {
    let db = match &state.database {
        Some(db) => db,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "no_database", "status": 503})),
            )
                .into_response();
        }
    };

    match db.get_monthly_usage(&api_key.0).await {
        Ok(usage) => {
            let month = chrono::Utc::now().format("%Y-%m").to_string();
            let limit = tier.monthly_limit();
            Json(json!({
                "tier": tier.name().to_lowercase(),
                "month": month,
                "conversions": { "used": usage.conversion_count, "limit": limit },
                "info_requests": usage.info_count,
            }))
            .into_response()
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal_error", "message": format!("{e}"), "status": 500})),
            )
                .into_response()
        }
    }
}

/// convert_handler and info_handler omitted for brevity — see git history
/// for full implementation (commit fe8a60a).

*/
