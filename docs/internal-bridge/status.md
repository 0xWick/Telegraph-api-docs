# Status

`GET /status` — node liveness check. Used by peer validators' `IsAlive` poll.
No auth. Always 200 with the status object (or 500 on failure).

See [overview](networks.md#status) for full details.