# Project rules

- Price and discount together: price first, discount in brackets — 300円（1時間無料）, never
  1時間無料（300円）. Use `priceLabel()` from `lib/price-label.js` (owner, 2026-11-16).

# Lessons (owner's rule, 2026-11-21)

Every time Claude tells the owner "I should not have…" (or admits a mistake in other words),
record the lesson in the same turn: here, and in the Project doc `claude/lessons.md`
(the full table with what went wrong is there). Tell the owner it was recorded.

- A phone number, ID or amount must never break across lines: set `white-space: nowrap` whenever
  one is added or enlarged, and look at it at phone width (375px) before reporting it done.
  The Park Direct number 050-3173-9036 broke after "050-3173-" when Claude enlarged it (2026-11-27).
- Before telling the owner that "another session" or someone else made a change, check who made
  it: the commit's `Claude-Session` trailer and `git reflog` (an entry starting "commit:" was made
  in this workspace). Twice on 2026-11-27 Claude said another session was editing the site; both
  commits were this session's own, from a first attempt at the owner's message that was cut off
  and started again. When work turns out to be half done already, check the reflog before
  explaining why (2026-11-27).
- "Check before warning" also covers saying what another document "still says": open it and read
  the passage before calling it out of date or asking whether to update it (2026-11-27, from the
  sign chat).
- Read the Project doc `claude/project-index.md` as well as `claude/lessons.md` before the first
  answer of a session, and check it again before advising the owner to download, check or ask
  something. Claude urged a ParkingWeb download three times when the index already recorded that
  ParkingWeb has had no data since April 2026 (2026-11-26).
- Do not build in limits, restrictions or business rules the owner did not ask for. When Claude
  thinks a change is needed that the owner may not have realised (a limit, a safeguard, an extra
  feature, a side fix), Claude only proposes it: say what it is, why, and wait for a yes. Do not
  apply it and report afterwards. When an existing behaviour surprises the owner, say plainly
  whether the owner asked for it or Claude added it (2026-11-26, extended the same day).
- Before comparing figures from a web page, confirm the page is ours (name, address, ID). Our
  Park Direct page is PK000187048 (2026-11-23).
- Do exactly what the owner asked. If an instruction seems to contradict an earlier rule, ask
  before departing from it; never "correct" it silently (2026-11-21).
- Write phone numbers and other identifiers in full, every time: 0120-951-365, never "951-365"
  or "0120". Same for site number 04672, document numbers, IDs and amounts (2026-11-21).
- Before asking the owner for a fact, search what is already on record: project docs, the
  Amano/AMS email threads, attached files, past chats (2026-11-21). The same search comes before
  writing "not known" in a figure or ending an answer with a question. Claude called Park Direct's
  fee unknown twice and asked for it; the memory notes and a chat of 2026-11-25 had it (8% of the
  rent before tax plus tax, 1,320円, paid by the tenant) (2026-11-26).
- Before saying "no reply yet", read the whole email thread, not only the sent message (2026-11-21).
- Check before warning: do not state a side effect or risk as fact without looking at the code,
  page or document. If it was not checked, say so (2026-11-20).
- Do not give menu paths or procedures of outside services from memory; open the page or say
  "I am not sure" (2026-11-20).
- Say everything that matters before the owner acts on an outside service (2026-11-20).

# Fee simulator (owner, 2026-11-26)

- It calculates any range of dates; no upper limit.
- A stay over 48 hours is not prohibited. It must be reported to the AMS support centre in
  advance, so the simulator shows a notice and still calculates.
- Kept by the owner's decision (2026-11-27): a date whose year is still being typed counts as
  not entered yet, and the breakdown lines are drawn only while the breakdown is open.

# AMS phone numbers (owner, 2026-11-21)

- 0120-951-365 with site number 04672: the only public number (website and signs).
- 0120-935-624: business line, admin dashboard only, never on a public or partner page.
- 0120-956-824: not used anywhere.
