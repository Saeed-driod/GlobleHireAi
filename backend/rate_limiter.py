import time
import threading
from collections import defaultdict
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Stores timestamps of requests per client IP.
    """
    def __init__(self, max_requests: int, window_seconds: int, name: str = "rate_limit"):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.name = name
        self.lock = threading.Lock()
        self.requests = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def check(self, request: Request):
        ip = self._get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self.lock:
            # Clean expired timestamps for this IP
            valid_timestamps = [t for t in self.requests[ip] if t > cutoff]
            
            if len(valid_timestamps) >= self.max_requests:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(oldest + self.window_seconds - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for {self.name}. Please wait {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )

            valid_timestamps.append(now)
            self.requests[ip] = valid_timestamps

            # Memory safeguard: periodically prune stale IPs
            if len(self.requests) > 2000:
                for k in list(self.requests.keys()):
                    self.requests[k] = [t for t in self.requests[k] if t > cutoff]
                    if not self.requests[k]:
                        del self.requests[k]

    def reset(self):
        """Helper for testing: clears all rate limit records."""
        with self.lock:
            self.requests.clear()
