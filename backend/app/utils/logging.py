import logging
import sys


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure and return the root application logger."""
    logger = logging.getLogger("akshararecover")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


def get_logger(name: str = "akshararecover") -> logging.Logger:
    """Return a child logger."""
    return logging.getLogger(f"akshararecover.{name}")
