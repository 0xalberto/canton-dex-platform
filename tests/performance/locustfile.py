"""
Load testing with Locust for CantonDEX.
"""

import os
from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import json
import random


class CantonDEXUser(FastHttpUser):
    """Simulated user for load testing."""

    wait_time = between(1, 3)

    def on_start(self):
        """Setup user and login."""
        self.token = None
        self.order_ids = []
        self.login()

    def login(self):
        """Login and get auth token."""
        response = self.client.post(
            '/auth/login',
            json={
                'username': f'trader_{random.randint(1, 1000)}@example.com',
                'password': 'password123'
            }
        )
        if response.status_code == 200:
            self.token = response.json()['access_token']

    def get_headers(self):
        """Get authorization headers."""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    @task(3)
    def view_portfolio(self):
        """View portfolio - high frequency task."""
        self.client.get(
            '/portfolio',
            headers=self.get_headers(),
            name='/portfolio'
        )

    @task(2)
    def list_orders(self):
        """List orders."""
        self.client.get(
            '/orders',
            headers=self.get_headers(),
            name='/orders'
        )

    @task(2)
    def create_order(self):
        """Create limit order."""
        symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']
        sides = ['BUY', 'SELL']

        response = self.client.post(
            '/orders',
            headers=self.get_headers(),
            json={
                'symbol': random.choice(symbols),
                'side': random.choice(sides),
                'quantity': random.randint(100000, 5000000),
                'price': round(random.uniform(0.9, 1.2), 4),
                'order_type': 'LIMIT'
            },
            name='/orders POST'
        )

        if response.status_code == 201:
            self.order_ids.append(response.json()['id'])

    @task(1)
    def get_trades(self):
        """Get trades."""
        self.client.get(
            '/trades',
            headers=self.get_headers(),
            name='/trades'
        )

    @task(1)
    def check_margins(self):
        """Check margin info."""
        self.client.get(
            '/risk/margin',
            headers=self.get_headers(),
            name='/risk/margin'
        )

    @task(1)
    def cancel_order(self):
        """Cancel an order if available."""
        if self.order_ids:
            order_id = random.choice(self.order_ids)
            self.client.post(
                f'/orders/{order_id}/cancel',
                headers=self.get_headers(),
                name='/orders/{order_id}/cancel'
            )


class APIStressTestUser(HttpUser):
    """User for stress testing."""

    wait_time = between(0.1, 0.5)  # Shorter wait time for stress

    def on_start(self):
        self.token = None
        self.login()

    def login(self):
        response = self.client.post(
            '/auth/login',
            json={
                'username': f'stress_{random.randint(1, 5000)}@example.com',
                'password': 'password123'
            }
        )
        if response.status_code == 200:
            self.token = response.json()['access_token']

    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    @task
    def rapid_order_creation(self):
        """Rapidly create orders."""
        self.client.post(
            '/orders',
            headers=self.get_headers(),
            json={
                'symbol': 'EURUSD',
                'side': random.choice(['BUY', 'SELL']),
                'quantity': random.randint(100000, 1000000),
                'price': 1.0950,
                'order_type': 'MARKET'
            },
            name='/orders (stress)'
        )


# Configure response time assertions
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, context, exception, **kwargs):
    """Check response time meets targets."""
    if exception:
        return

    # Target: P95 latency < 50ms for API Gateway
    if response_time > 50 and '/health' not in name:
        print(f"⚠️  Slow response: {name} took {response_time}ms")


# Performance test configuration
if __name__ == '__main__':
    import sys

    # Example: locust -f locustfile.py --headless -u 100 -r 10 -t 5m
    print("""
    Load Test Examples:

    1. Normal load (100 users):
       locust -f locustfile.py --headless -u 100 -r 10 -t 5m

    2. Stress test (500 users):
       locust -f locustfile.py -f stress.py --headless -u 500 -r 50 -t 10m

    3. Endurance test (24 hours):
       locust -f locustfile.py --headless -u 50 -r 5 -t 24h

    4. Interactive mode:
       locust -f locustfile.py
    """)
