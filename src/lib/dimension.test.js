import { describe, expect, test } from "vitest";
import { evaluate, fmtFtIn } from "./dimension.js";
import { parseScale } from "./scales.js";

const len = (e, den = 16) => fmtFtIn(evaluate(e).v, den);

describe("evaluate", () => {
  test("adds feet-inch-fractions", () => {
    expect(len(`12' 6-1/2" + 3' 9-3/4"`)).toBe(`16' 4-1/4"`);
  });
  test("treats a bare number after feet as inches", () => {
    expect(len(`5' 6 - 1/2`)).toBe(`5' 5-1/2"`);
  });
  test("subtracts with spaces, mixed fraction without", () => {
    expect(evaluate("12 - 1/2").v).toBe(11.5);
    expect(evaluate("12-1/2").v).toBe(12.5);
  });
  test("length × length is area", () => {
    const r = evaluate(`16' × 9' 6"`);
    expect(r.d).toBe(2);
    expect(r.v / 144).toBe(152);
  });
  test("length³ is volume", () => {
    const r = evaluate(`(10'+2') × 4' × 4"`);
    expect(r.d).toBe(3);
    expect(r.v / 1728).toBe(16);
  });
  test("converts metric", () => {
    expect(len("1.6m")).toBe(`5' 3"`);
  });
  test("rejects mismatched dimensions", () => {
    expect(() => evaluate(`5' + 3' * 3'`)).toThrow(/Can't add/);
  });
});

describe("fmtFtIn", () => {
  test("rounds to the chosen fraction", () => {
    expect(fmtFtIn(96 / 7, 16)).toBe(`1' 1-11/16"`);
    expect(fmtFtIn(96 / 7, 64)).toBe(`1' 1-23/32"`);
  });
});

describe("parseScale", () => {
  test("reads architectural, engineering and metric forms", () => {
    expect(parseScale(`3/16" = 1'`)).toBe(64);
    expect(parseScale(`1" = 30'`)).toBe(360);
    expect(parseScale("1:75")).toBe(75);
  });
});
