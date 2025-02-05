import { it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { memoryLocation } from "wouter/memory-location";

it("returns a hook that is compatible with location spec", () => {
  const { hook } = memoryLocation();

  const { result, unmount } = renderHook(() => hook());
  const [value, update] = result.current;

  expect(typeof value).toBe("string");
  expect(typeof update).toBe("function");
  unmount();
});

it("should support initial path", () => {
  const { hook } = memoryLocation({ path: "/test-case" });

  const { result, unmount } = renderHook(() => hook());
  const [value] = result.current;

  expect(value).toBe("/test-case");
  unmount();
});

it("should support initial path with query", () => {
  const { searchHook } = memoryLocation({ path: "/test-case?foo=bar" });
  const { result, unmount } = renderHook(() => searchHook());

  expect(result.current).toBe("foo=bar");
  unmount();
});

it("should support initial search path", () => {
  const { searchHook } = memoryLocation({ path: "/test-case", searchPath: "foo=bar" });
  const { result, unmount } = renderHook(() => searchHook());

  expect(result.current).toBe("foo=bar");
  unmount();
});

it("should support initial path with query and search path", () => {
  const { hook, searchHook } = memoryLocation({ path: "/test-case?foo=bar", searchPath: "bar=baz" });

  const { result: locationResult, unmount: unmountLocation } = renderHook(() => hook());
  const [location] = locationResult.current;

  const { result: searchResult, unmount: unmountSearch } = renderHook(() => searchHook());
  const search = searchResult.current;

  expect(location).toBe("/test-case");
  expect(search).toBe("foo=bar&bar=baz");

  unmountLocation();
  unmountSearch();
});

it('should return location hook that has initial path "/" by default', () => {
  const { hook } = memoryLocation();

  const { result, unmount } = renderHook(() => hook());
  const [value] = result.current;

  expect(value).toBe("/");
  unmount();
});

it("should return location hook that strips query from path", () => {
  const { hook } = memoryLocation({ path: "/?foo=bar" });

  const { result, unmount } = renderHook(() => hook());
  const [value] = result.current;

  expect(value).toBe("/");
  unmount();
});

it('should return search hook that has initial query "" by default', () => {
  const { searchHook } = memoryLocation();
  const { result, unmount } = renderHook(() => searchHook());

  expect(result.current).toBe("");
  unmount();
});

it("should return standalone `navigate` method", () => {
  const { hook, navigate } = memoryLocation();

  const { result, unmount } = renderHook(() => hook());

  act(() => navigate("/standalone"));

  const [value] = result.current;
  expect(value).toBe("/standalone");
  unmount();
});

it("should return location and search hooks that supports navigation", () => {
  const { hook, searchHook } = memoryLocation();

  const { result: locationResult, unmount: unmountLocation } = renderHook(() => hook());
  const { result: searchResult, unmount: unmountSearch } = renderHook(() => searchHook());

  act(() => locationResult.current[1]("/location?foo=bar"));

  expect(locationResult.current[0]).toBe("/location");
  expect(searchResult.current).toBe("foo=bar");

  act(() => locationResult.current[1]("/location"));

  expect(locationResult.current[0]).toBe("/location");
  expect(searchResult.current).toBe("");

  unmountLocation();
  unmountSearch();
});

it("should record all history when `record` option is provided", () => {
  const {
    hook,
    history,
    navigate: standalone,
  } = memoryLocation({ record: true, path: "/test" });

  const { result, unmount } = renderHook(() => hook());

  act(() => standalone("/standalone"));
  act(() => result.current[1]("/location"));

  expect(result.current[0]).toBe("/location");

  expect(history).toStrictEqual(["/test", "/standalone", "/location"]);

  act(() => standalone("/standalone", { replace: true }));

  expect(history).toStrictEqual(["/test", "/standalone", "/standalone"]);

  act(() => result.current[1]("/location", { replace: true }));

  expect(history).toStrictEqual(["/test", "/standalone", "/location"]);

  unmount();
});

it("should not have history when `record` option is falsy", () => {
  // @ts-expect-error
  const { history, reset } = memoryLocation();
  expect(history).not.toBeDefined();
  expect(reset).not.toBeDefined();
});

it("should have reset method when `record` option is provided", () => {
  const { history, reset, navigate } = memoryLocation({
    path: "/initial",
    record: true,
  });
  expect(history).toBeDefined();
  expect(reset).toBeDefined();

  navigate("test-1");
  navigate("test-2");

  reset();

  expect(history).toStrictEqual(["/initial"]);
});

it("should have reset method that reset hook location", () => {
  const { hook, history, navigate, reset } = memoryLocation({
    record: true,
    path: "/test",
  });
  const { result, unmount } = renderHook(() => hook());

  act(() => navigate("/location"));

  expect(result.current[0]).toBe("/location");

  expect(history).toStrictEqual(["/test", "/location"]);

  act(() => reset());

  expect(history).toStrictEqual(["/test"]);

  expect(result.current[0]).toBe("/test");

  unmount();
});
