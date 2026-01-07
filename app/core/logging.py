import logging
import json
import uuid
from typing import Any
from fastapi import Request
from contextvars import ContextVar

# Context var to store request ID
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="system")

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "request_id": request_id_ctx.get(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging(level: str = "INFO"):
    logger = logging.getLogger()
    logger.setLevel(level)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    
    # clear existing handlers
    logger.handlers = []
    logger.addHandler(handler)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
