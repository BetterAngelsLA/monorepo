"""Hello unit test module."""

from python_library_example.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello python-library-example"
