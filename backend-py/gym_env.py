import gymnasium as gym
from gymnasium import spaces
import requests
import json
from typing import Optional, Dict, Any, List

class GoogleCalendarEnv(gym.Env):
    """
    A generic Gymnasium API-based environment for Google Calendar RL Agents.
    Focuses on natural language or dictionary payloads mapping dynamically
    to FastAPI endpoints.
    """
    metadata = {"render_modes": ["ansi", "human"]}

    def __init__(self, base_url: str = "http://localhost:8000"):
        super(GoogleCalendarEnv, self).__init__()
        self.base_url = base_url
        self.state = None

        # Actions are mapped to API JSON payloads.
        # action format: {"action": "create_event", "payload": "{...}"} (JSON encoded)
        self.action_space = spaces.Dict(
            {
                "action": spaces.Text(max_length=100),
                "payload": spaces.Text(max_length=10000),
            }
        )

        # Observation is a JSON serialized representation of the environment State.
        self.observation_space = spaces.Text(max_length=100000)

    def _get_info(self) -> Dict[str, Any]:
        return {"current_events_count": len(self.state.get("events", [])) if self.state else 0}

    def reset(self, *, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None):
        super().reset(seed=seed)
        
        # We can seed initial events into the database on reset
        seed_events = options.get("seed_events", []) if options else []
        
        response = requests.post(f"{self.base_url}/env/reset", json={"seed_events": seed_events})
        response.raise_for_status()
        self.state = response.json()
        
        return json.dumps(self.state), self._get_info()

    def step(self, action: Dict[str, Any]):
        """
        Execute an API Action on the FastAPI backend.
        action_space payload expects containing: 'action', 'payload'
        Returns: observation, reward, terminated, truncated, info
        """
        try:
            payload_dict = json.loads(action.get("payload", "{}"))
        except json.JSONDecodeError:
            payload_dict = {}

        req_payload = {
            "action": action.get("action", ""),
            "payload": payload_dict
        }
        
        response = requests.post(f"{self.base_url}/env/step", json=req_payload)
        
        if response.status_code != 200:
            # Fatal error conceptually, but we can return negative reward
            info = {"error": response.text}
            return self.state, -1.0, False, False, info
            
        data = response.json()
        self.state = data.get("state", self.state)
        success = data.get("success", False)
        
        # A rudimentary generic reward function
        reward = 1.0 if success else -1.0
        
        # Non-terminating environment naturally. 
        terminated = False
        truncated = False
        info = {
            "message": data.get("message", ""),
            "action_taken": data.get("action_taken", ""),
            "success": success
        }
        
        return json.dumps(self.state), reward, terminated, truncated, info

    def render(self, mode="human"):
        if mode == "human":
            print(f"--- Google Calendar State ---")
            print(json.dumps(self.state, indent=2))
        return self.state
