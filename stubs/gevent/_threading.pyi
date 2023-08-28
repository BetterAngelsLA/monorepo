"""
This type stub file was generated by pyright.
"""

"""
A small selection of primitives that always work with
native threads. This has very limited utility and is
targeted only for the use of gevent's threadpool.
"""
__all__ = ['Lock', 'Queue', 'EmptyTimeout']
def acquire_with_timeout(lock, timeout=...):
    ...

class _Condition:
    __slots__ = ...
    def __init__(self, lock) -> None:
        ...
    
    def __enter__(self):
        ...
    
    def __exit__(self, t, v, tb):
        ...
    
    def __repr__(self): # -> str:
        ...
    
    def wait(self, wait_lock, timeout=..., _wait_for_notify=...):
        ...
    
    def notify_one(self): # -> None:
        ...
    


class EmptyTimeout(Exception):
    """Raised from :meth:`Queue.get` if no item is available in the timeout."""
    ...


class Queue:
    """
    Create a queue object.

    The queue is always infinite size.
    """
    __slots__ = ...
    def __init__(self) -> None:
        ...
    
    def task_done(self): # -> None:
        """Indicate that a formerly enqueued task is complete.

        Used by Queue consumer threads.  For each get() used to fetch a task,
        a subsequent call to task_done() tells the queue that the processing
        on the task is complete.

        If a join() is currently blocking, it will resume when all items
        have been processed (meaning that a task_done() call was received
        for every item that had been put() into the queue).

        Raises a ValueError if called more times than there were items
        placed in the queue.
        """
        ...
    
    def qsize(self, len=...):
        """Return the approximate size of the queue (not reliable!)."""
        ...
    
    def empty(self): # -> bool:
        """Return True if the queue is empty, False otherwise (not reliable!)."""
        ...
    
    def full(self): # -> Literal[False]:
        """Return True if the queue is full, False otherwise (not reliable!)."""
        ...
    
    def put(self, item): # -> None:
        """Put an item into the queue.
        """
        ...
    
    def get(self, cookie, timeout=...):
        """
        Remove and return an item from the queue.

        If *timeout* is given, and is not -1, then we will
        attempt to wait for only that many seconds to get an item.
        If those seconds elapse and no item has become available,
        raises :class:`EmptyTimeout`.
        """
        ...
    
    def allocate_cookie(self):
        """
        Create and return the *cookie* to pass to `get()`.

        Each thread that will use `get` needs a distinct cookie.
        """
        ...
    
    def kill(self): # -> None:
        """
        Call to destroy this object.

        Use this when it's not possible to safely drain the queue, e.g.,
        after a fork when the locks are in an uncertain state.
        """
        ...
    


