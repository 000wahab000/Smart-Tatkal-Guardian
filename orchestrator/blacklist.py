# In-memory blacklist.
# Global: blacklist = set(), honeypot_counts = dict()
# Functions:
# - maybe_blacklist(user_id): increment count, if >= 3 add to blacklist
# - is_blacklisted(user_id) -> bool
# - get_blacklist() -> list
# - clear_blacklist(): clears both dicts

blacklist = set()
honeypot_counts = dict()


def maybe_blacklist(user_id: str):
    """Increment honeypot hit count for user_id; blacklist if >= 3."""
    global blacklist, honeypot_counts
    honeypot_counts[user_id] = honeypot_counts.get(user_id, 0) + 1
    if honeypot_counts[user_id] >= 3:
        blacklist.add(user_id)


def is_blacklisted(user_id: str) -> bool:
    """Check if user_id is in the blacklist."""
    return user_id in blacklist


def get_blacklist() -> list:
    """Return all blacklisted user IDs as a list."""
    return list(blacklist)


def clear_blacklist():
    """Clear both the blacklist set and honeypot counts dict."""
    global blacklist, honeypot_counts
    blacklist.clear()
    honeypot_counts.clear()
