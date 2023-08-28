"""
This type stub file was generated by pyright.
"""

"""
Iterators across greenlets or AsyncResult objects.

"""
__all__ = ['IMapUnordered', 'IMap']
class Failure:
    __slots__ = ...
    def __init__(self, exc, raise_exception=...) -> None:
        ...
    


class IMapUnordered(Greenlet):
    """
    At iterator of map results.
    """
    def __init__(self, func, iterable, spawn, maxsize=..., _zipped=...) -> None:
        """
        An iterator that.

        :param callable spawn: The function we use to create new greenlets.
        :keyword int maxsize: If given and not-None, specifies the maximum number of
            finished results that will be allowed to accumulated awaiting the reader;
            more than that number of results will cause map function greenlets to begin
            to block. This is most useful is there is a great disparity in the speed of
            the mapping code and the consumer and the results consume a great deal of resources.
            Using a bound is more computationally expensive than not using a bound.

        .. versionchanged:: 1.1b3
            Added the *maxsize* parameter.
        """
        ...
    
    def __iter__(self): # -> Self@IMapUnordered:
        ...
    
    def __next__(self): # -> Failure:
        ...
    
    next = ...


class IMap(IMapUnordered):
    def __init__(self, *args, **kwargs) -> None:
        ...
    


