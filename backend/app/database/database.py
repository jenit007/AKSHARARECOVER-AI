from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings
import logging

logger = logging.getLogger("akshararecover.database")


class Base(DeclarativeBase):
    pass


def get_engine():
    settings = get_settings()
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        pool_pre_ping=True,
    )

    # Enable WAL mode and foreign keys for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


engine = None
SessionLocal = None


def _ensure_schema_columns(target_engine):
    """Idempotently add any missing columns/indexes to existing tables during upgrades."""
    inspector = inspect(target_engine)
    existing_tables = set(inspector.get_table_names())

    alterations = {
        "manuscripts": [
            ("user_id", "VARCHAR(36)"),
            ("description", "TEXT"),
            ("historical_period", "VARCHAR(150)"),
            ("region", "VARCHAR(150)"),
        ],
        "processing_jobs": [
            ("user_id", "VARCHAR(36)"),
        ],
        "heritage_records": [
            ("user_id", "VARCHAR(36)"),
            ("visibility", "VARCHAR(50) DEFAULT 'PRIVATE'"),
        ],
        "community_contributions": [
            ("user_id", "VARCHAR(36)"),
        ],
    }

    indexes = [
        ("manuscripts", "ix_manuscripts_user_id", "user_id"),
        ("processing_jobs", "ix_processing_jobs_user_id", "user_id"),
        ("heritage_records", "ix_heritage_records_user_id", "user_id"),
        ("heritage_records", "ix_heritage_records_visibility", "visibility"),
    ]

    with target_engine.begin() as conn:
        for table_name, cols in alterations.items():
            if table_name in existing_tables:
                existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                for col_name, col_type in cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                        logger.info("Added column %s.%s", table_name, col_name)

        for table_name, idx_name, col_name in indexes:
            if table_name in existing_tables:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({col_name})"))


def init_db():
    global engine, SessionLocal
    import app.database.models  # noqa: F401
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        _ensure_schema_columns(engine)
    except Exception as exc:
        logger.warning("Schema column check warning: %s", exc)
    logger.info("Database initialized")


def get_db():
    if SessionLocal is None:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
