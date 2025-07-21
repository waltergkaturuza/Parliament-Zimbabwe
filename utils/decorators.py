# utils.py
from pybreaker import CircuitBreaker

report_breaker = CircuitBreaker(
    fail_max=3,
    reset_timeout=60
)

@report_breaker
def generate_large_report():
    # Resource-intensive operation