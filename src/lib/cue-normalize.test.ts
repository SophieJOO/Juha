import assert from "node:assert/strict";
import { normalizeCueText } from "@/lib/cue-normalize";

const sameCases = [
  ["친구가 한 번 더 제안", "친구가 한번더 제안"],
  ["친구가　한　번　더　제안！", "친구가 한 번 더 제안"],
  ["재경기 제안.", "재경기  제안"],
] as const;

for (const [left, right] of sameCases) {
  assert.equal(
    normalizeCueText(left),
    normalizeCueText(right),
    `${left} should normalize the same as ${right}`,
  );
}

assert.notEqual(
  normalizeCueText("주하만 다시 요구함"),
  normalizeCueText("주하가 또 다시 요구함"),
);

assert.equal(normalizeCueText("ＡＢ１２"), "ab12");
assert.equal(normalizeCueText("  　！!?., "), "");

console.log("normalizeCueText checks passed");
