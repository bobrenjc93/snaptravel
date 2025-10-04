#!/usr/bin/env python3
import functools, json, os, traceback
from typing import Optional, Set, Union

LOG_PATH = "/tmp/log.txt"

# ------------------------
# Snapshot decorator
# ------------------------
def safe_for_json(obj, depth=0, max_depth=4, seen=None):
    """Recursively turn any Python object into a JSON-safe structure.
       If not serializable, fall back to repr(obj)."""
    if seen is None:
        seen = set()
    oid = id(obj)
    if oid in seen:
        return f"<cycle:{repr(obj)}>"

    seen.add(oid)

    # Primitive types
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if depth >= max_depth:
        return repr(obj)

    # Dict
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            try:
                key = str(k) if isinstance(k, (str, int, float, bool)) else repr(k)
            except Exception:
                key = f"<key:{id(k)}>"
            out[key] = safe_for_json(v, depth+1, max_depth, seen)
        return out

    # Sequence
    if isinstance(obj, (list, tuple, set)):
        return [safe_for_json(v, depth+1, max_depth, seen) for v in obj]

    # User-defined objects: inspect __dict__
    if hasattr(obj, "__dict__"):
        fields = {}
        for k, v in vars(obj).items():
            fields[str(k)] = safe_for_json(v, depth+1, max_depth, seen)
        return {"__class__": type(obj).__name__, **fields}

    # Fallback: try dumping directly, else repr
    try:
        json.dumps(obj)
        return obj
    except Exception:
        return repr(obj)


def snapshot_class(methods: Optional[Union[str, Set[str]]] = None):
    """
    Decorator to instrument specific methods of a class for state change tracking.

    Args:
        methods: Optional method name(s) to instrument. Can be:
                - None: instrument all methods (default behavior)
                - str: instrument single method (e.g., "__setitem__")
                - Set[str]: instrument multiple methods (e.g., {"__setitem__", "__getitem__"})

    Usage:
        @snapshot_class({"__setitem__"})  # Only instrument __setitem__
        class MyClass:
            ...

        @snapshot_class("__setitem__")    # Only instrument __setitem__
        class MyClass:
            ...

        @snapshot_class()                 # Instrument all methods
        class MyClass:
            ...
    """
    # Handle different input types
    if isinstance(methods, str):
        target_methods = {methods}
    elif methods is None:
        target_methods = None  # Instrument all methods
    else:
        target_methods = set(methods) if methods else None

    def decorator(cls):
        def wrap_method(name, func):
            @functools.wraps(func)
            def wrapper(self, *args, **kwargs):
                before = {k: safe_for_json(v) for k, v in self.__dict__.items()}
                result = func(self, *args, **kwargs)
                after = {k: safe_for_json(v) for k, v in self.__dict__.items()}

                changes = {}
                for k in set(before) | set(after):
                    if before.get(k) != after.get(k):
                        changes[str(k)] = {"before": before.get(k), "after": after.get(k)}

                if changes:
                    # Capture backtrace excluding this wrapper and decorator frames
                    stack = traceback.extract_stack()[:-2]
                    bt = [
                        {
                            "file": frame.filename,
                            "line": frame.lineno,
                            "function": frame.name,
                            "code": frame.line,
                        }
                        for frame in stack
                    ]
                    record = {
                        "class": cls.__name__,
                        "method": name,
                        "changes": changes,
                        "backtrace": bt,
                    }
                    with open(LOG_PATH, "a") as f:
                        f.write(json.dumps(record) + "\n")
                return result
            return wrapper

        # Instrument only specified methods or all methods if none specified
        for attr_name, attr_value in list(vars(cls).items()):
            if callable(attr_value):
                # If target_methods is None, instrument all methods
                # If target_methods is specified, only instrument those methods
                if target_methods is None or attr_name in target_methods:
                    setattr(cls, attr_name, wrap_method(attr_name, attr_value))
        return cls

    return decorator


# ------------------------
# Dummy SymInt + SymNodeDict
# ------------------------
class DummySymInt:
    def __init__(self, name: str):
        self.node = name
    def __repr__(self):
        return f"<SymInt {self.node}>"


@snapshot_class({"__setitem__"})  # Only instrument __setitem__
class _SymNodeDict:
    """Wrapper around a dictionary that will hash SymInts with their nodes"""
    def __init__(self) -> None:
        self.sym_node_dict: dict[str, object] = {}
    def __setitem__(self, key: DummySymInt, value: object) -> None:
        self.sym_node_dict[key.node] = value
    def __getitem__(self, key: DummySymInt) -> object:
        return self.sym_node_dict[key.node]
    def __contains__(self, key: DummySymInt) -> bool:
        return key.node in self.sym_node_dict
    def get(self, key: DummySymInt, default=None) -> object:
        return self.sym_node_dict.get(key.node, default)
    def __len__(self) -> int:
        return len(self.sym_node_dict)
    def __repr__(self):
        return f"_SymNodeDict({self.sym_node_dict})"


# ------------------------
# Dummy Tracer
# ------------------------
@snapshot_class({"add_sym", "toggle"})  # Only instrument specific methods
class PythonKeyTracer:
    def __init__(self):
        self.symnode_tracker = _SymNodeDict()
        self.sympy_expr_tracker = {}
        self.torch_fn_counts = {}
        self.enable_thunkify = False

    def add_sym(self, key: str, val: object):
        s = DummySymInt(key)
        self.symnode_tracker[s] = val

    def toggle(self):
        self.enable_thunkify = not self.enable_thunkify


# ------------------------
# Demo run
# ------------------------
def main():
    if os.path.exists(LOG_PATH):
        os.remove(LOG_PATH)

    tracer = PythonKeyTracer()
    tracer.add_sym("s57", object())
    tracer.add_sym("s99", [1, 2, 3])
    tracer.toggle()

    print(f"Done. Logs written to {LOG_PATH}")
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            for line in f:
                print(line.strip())
    else:
        print("No log file created (no changes detected)")

if __name__ == "__main__":
    main()