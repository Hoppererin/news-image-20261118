# The World Today — 18 November 2026

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/geishakampret/news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/geishakampret/news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

One image summing up **Wednesday 18 November 2026** — six stories that defined
the day, drawn as a newspaper front page:

1. **US sinks five Iranian tankers** — Iran hits ships near Hormuz and a US base in Jordan (Middle East)
2. **Xi hosts Trump and Putin at APEC** — leaders gather in Shenzhen; Trump flew in from Manila (Asia, diplomacy)
3. **Ukraine hits the Kerch Bridge again** — second night in a row; Russia hits back (Europe, war)
4. **Nvidia revenue doubles to $115.8B** — AI chip sales jumped 103% in the first results since founder Jensen Huang quit as CEO (tech, markets)
5. **COP31 talks enter decisive phase** — 144 disputed items in Antalya, summit due to end Friday (climate)
6. **North Korea fires a missile to sea** — ballistic missile into the Sea of Japan (Asia, security)

Sources: Reuters, Al Jazeera, Le Monde, TechCrunch, AJP, South Korea JCS — all
stories reported on 18 November 2026.

## How it works

`main.ts` (Node 22, standard library only) draws the whole 1024×1024 poster
programmatically — its own PNG encoder (`node:zlib` + hand-rolled CRC32) and
its own hand-written 5×7 bitmap font — so every letter is exactly right and
the output is fully deterministic. No network, no randomness, no timestamps:
running it twice writes byte-identical PNGs.

## Run it

```sh
node main.ts
# writes entry.png to $MAKEFUN_OUTPUT_DIR (default: /output)
```

Verify determinism:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts
MAKEFUN_OUTPUT_DIR=/tmp/out2 node main.ts
sha256sum /tmp/out1/entry.png /tmp/out2/entry.png   # identical hashes
```

Output: `entry.png`, 1024×1024, ~20 KB (limit: 1 MiB).

## License

MIT — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=dhj53q2r&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
