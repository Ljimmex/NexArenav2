import type React from "react"

export type SimpleMatch = {
  id: string
  round: number
  is_bronze_match?: boolean
}

interface MatchConnectionLinesProps {
  layoutMatches: SimpleMatch[]
  getMatchPosition: (match: SimpleMatch) => { left: string; top: string }

  // Style
  lineColor?: string
  lineThickness?: number
  cornerSize?: number
  dotSize?: number

  // Geometry assumptions (dopasuj do swoich kart)
  cardWidth?: number
  cardHeight?: number
  rowsPerMatch?: number // zwykle 2
  localGap?: number // odstęp od prawej krawędzi karty do lokalnego pnia
  endYOffset?: number // pozytywne obniża 3. sekcję względem środka meczu docelowego
  startYOffset?: number // pozytywne obniża wyjścia z kart (Sektor 1)
}

/**
 * Wersja SVG z zaokrąglonymi narożnikami bez “przerw”.
 * 3 sektory:
 * 1) Per-mecz: 2 prostokąty -> poziomy + łokieć -> lokalny pionowy pień (kropka w środku), wyjście środkiem.
 * 2) Wspólny pień: łączy wyjścia z 2 meczów poprzedniej rundy.
 * 3) Odcinek do kolejnego meczu: ew. przedłużenie pnia, łokieć i poziomy do karty docelowej.
 */
export const MatchConnectionLines: React.FC<MatchConnectionLinesProps> = ({
  layoutMatches,
  getMatchPosition,
  lineColor = "#22d3ee",
  lineThickness = 3,
  cornerSize = 14,
  dotSize = 8,
  cardWidth = 320,
  cardHeight = 120,
  rowsPerMatch = 2,
  localGap = 12,
  endYOffset = 40,
  startYOffset = 40,
}) => {
  const rowCenters = (top: number) => {
    const rowH = cardHeight / rowsPerMatch
    return Array.from({ length: rowsPerMatch }, (_, i) => top + rowH * i + rowH / 2)
  }

  // Helper do rysowania łuków 90°
  const arcTo = (rx: number, ry: number, sweep: 0 | 1, x: number, y: number) => `A ${rx} ${ry} 0 0 ${sweep} ${x} ${y}`

  return (
    <>
      {layoutMatches
        .filter((match) => match.round > 1)
        .map((match) => {
          // Znajdź dwa poprzednie mecze dla standardowego SE
          const prevRound = layoutMatches.filter((m) => m.round === match.round - 1 && !m.is_bronze_match)
          if (prevRound.length === 0) return null

          const endPos = getMatchPosition(match)
          const endX = Number.parseInt(endPos.left, 10)
          const endY = Number.parseInt(endPos.top, 10) + cardHeight / 2 + endYOffset

          const sameRound = layoutMatches.filter((m) => m.round === match.round && !m.is_bronze_match)
          const matchIndex = sameRound.findIndex((m) => m.id === match.id)
          const startIdx = matchIndex * 2
          const connectedMatches = prevRound.slice(startIdx, startIdx + 2)
          if (connectedMatches.length === 0) return null

          // Sektor 1: lokalne łączenie 2 prostokątów -> lokalny pień
          type LocalGroup = {
            // Ścieżki SVG sektora 1
            paths: string[]
            // Kropki startowe na krawędzi karty
            startDots: { x: number; y: number }[]
            // Kropka w połowie lokalnego pnia
            midDot: { x: number; y: number }
            // Wyjście do sektora 2
            exit: { x: number; y: number }
            // Punkty do obliczania bbox
            xs: number[]
            ys: number[]
          }

          const locals: LocalGroup[] = connectedMatches.map((cm) => {
            const cp = getMatchPosition(cm)
            const left = Number.parseInt(cp.left, 10)
            const top = Number.parseInt(cp.top, 10)
            const xCardRight = left + cardWidth
            const localTrunkX = xCardRight + localGap + cornerSize

            // Zastosuj startYOffset dla wyjść z kart
            const centers = rowCenters(top).map((y) => y + startYOffset)
            const topY = Math.min(...centers)
            const bottomY = Math.max(...centers)
            const midY = (topY + bottomY) / 2

            const paths: string[] = []
            const startDots: { x: number; y: number }[] = []
            const xs: number[] = [xCardRight, localTrunkX]
            const ys: number[] = [topY, bottomY, midY]

            centers.forEach((y) => {
              startDots.push({ x: xCardRight, y })

              // H do (localTrunkX - corner), łuk do pnia, V do środka
              const hEndX = localTrunkX - cornerSize
              const isTopRow = y === topY
              const elbowEndY = isTopRow ? y + cornerSize : y - cornerSize
              const sweep: 0 | 1 = isTopRow ? 1 : 0

              const d = [
                `M ${xCardRight} ${y}`,
                `H ${hEndX}`,
                arcTo(cornerSize, cornerSize, sweep, localTrunkX, elbowEndY),
                `V ${midY}`,
              ].join(" ")
              paths.push(d)

              xs.push(hEndX)
              ys.push(elbowEndY)
            })

            return {
              paths,
              startDots,
              midDot: { x: localTrunkX, y: midY },
              exit: { x: localTrunkX, y: midY },
              xs,
              ys,
            }
          })

          // Wyjścia z lokalnych pni (będą wejściami do pnia wspólnego)
          const exits = locals.map((l) => l.exit)
          const minExitX = Math.min(...exits.map((e) => e.x))
          const topExitY = Math.min(...exits.map((e) => e.y))
          const bottomExitY = Math.max(...exits.map((e) => e.y))

          // Pozycja wspólnego pnia
          const trunkX = minExitX + (endX - minExitX) / 2
          const sector2Inset = exits.length > 1 ? cornerSize : 0
          const trunkTop = topExitY + sector2Inset
          const trunkBottom = bottomExitY - sector2Inset

          // Sektor 2: z wyjść lokalnych do wspólnego pnia
          const sector2Paths: string[] = []
          const sector2Dots: { x: number; y: number }[] = [] // kropki na wyjściach
          exits.forEach((start) => {
            const hEndX = trunkX - cornerSize
            const isTop = start.y === topExitY
            const elbowEndY = isTop ? start.y + cornerSize : start.y - cornerSize
            const sweep: 0 | 1 = isTop ? 1 : 0

            const d = [
              `M ${start.x} ${start.y}`,
              `H ${hEndX}`,
              arcTo(cornerSize, cornerSize, sweep, trunkX, elbowEndY),
            ].join(" ")
            sector2Paths.push(d)
            sector2Dots.push({ x: start.x, y: start.y })
          })

          // Pień wspólny (pion)
          const trunkPath = trunkBottom > trunkTop ? [`M ${trunkX} ${trunkTop}`, `V ${trunkBottom}`].join(" ") : null
          const trunkDot =
            exits.length > 1 && trunkBottom > trunkTop ? { x: trunkX, y: (trunkTop + trunkBottom) / 2 } : null

          // Sektor 3: ew. przedłużenie pnia w górę/dół
          let sector3ExtPath: string | null = null
          if (endY < trunkTop) {
            const extTop = endY - cornerSize
            sector3ExtPath = [`M ${trunkX} ${extTop}`, `V ${trunkTop}`].join(" ")
          } else if (endY > trunkBottom) {
            const extTop = trunkBottom
            const extBottom = endY - cornerSize
            sector3ExtPath = [`M ${trunkX} ${extTop}`, `V ${extBottom}`].join(" ")
          }

          // Sektor 3: łokieć do meczu docelowego i poziomy do krawędzi
          const elbowToEnd = [
            `M ${trunkX} ${endY - cornerSize}`,
            arcTo(cornerSize, cornerSize, 1, trunkX + cornerSize, endY),
            `H ${endX}`,
          ].join(" ")

          // BBOX: policz zakres dla pojedynczej grupy i narysuj <svg> w tym obszarze
          const xCandidates: number[] = [endX, trunkX, trunkX + cornerSize]
          const yCandidates: number[] = [endY, endY - cornerSize, trunkTop, trunkBottom]

          locals.forEach((l) => {
            xCandidates.push(...l.xs)
            yCandidates.push(...l.ys, l.midDot.y)
          })
          exits.forEach((e) => {
            xCandidates.push(e.x, trunkX - cornerSize)
            yCandidates.push(e.y, e.y + cornerSize, e.y - cornerSize)
          })

          const minX = Math.min(...xCandidates) - 24
          const maxX = Math.max(...xCandidates) + 24
          const minY = Math.min(...yCandidates) - 24
          const maxY = Math.max(...yCandidates) + 24
          const width = Math.max(0, maxX - minX)
          const height = Math.max(0, maxY - minY)

          // Zamiast parsować d, po prostu generujmy d od razu w układzie lokalnym:
          const rel = (x: number, y: number) => `${x - minX} ${y - minY}`
          const relX = (x: number) => `${x - minX}`
          const relY = (y: number) => `${y - minY}`
          const arcRel = (rx: number, ry: number, sweep: 0 | 1, x: number, y: number) =>
            `A ${rx} ${ry} 0 0 ${sweep} ${x - minX} ${y - minY}`

          // Sector 1 (locals): dla każdej z 2 (lub rowsPerMatch) linii per mecz
          const localPathsOffset: string[] = []
          const localStartDots: { x: number; y: number }[] = []
          const localMidDots: { x: number; y: number }[] = []

          locals.forEach((l) => {
            localMidDots.push(l.midDot)
            l.startDots.forEach((sd) => localStartDots.push(sd))
          })

          // Zbuduj jeszcze raz ścieżki Sector 1
          connectedMatches.forEach((cm, i) => {
            const loc = locals[i]
            const cp = getMatchPosition(cm)
            const left = Number.parseInt(cp.left, 10)
            const top = Number.parseInt(cp.top, 10)
            const xCardRight = left + cardWidth
            const localTrunkX = loc.exit.x
            // Zastosuj startYOffset również tutaj
            const centers = rowCenters(top).map((y) => y + startYOffset)
            const topY = Math.min(...centers)
            const bottomY = Math.max(...centers)
            const midY = (topY + bottomY) / 2

            centers.forEach((y) => {
              const hEndX = localTrunkX - cornerSize
              const isTopRow = y === topY
              const elbowEndY = isTopRow ? y + cornerSize : y - cornerSize
              const sweep: 0 | 1 = isTopRow ? 1 : 0

              const d = [
                `M ${rel(xCardRight, y)}`,
                `H ${relX(hEndX)}`,
                arcRel(cornerSize, cornerSize, sweep, localTrunkX, elbowEndY),
                `V ${relY(midY)}`,
              ].join(" ")
              localPathsOffset.push(d)
            })
          })

          // Sector 2: od wyjść lokalnych do pnia oraz sam pień
          const sector2PathsOffset: string[] = []
          exits.forEach((start) => {
            const hEndX = trunkX - cornerSize
            const isTop = start.y === topExitY
            const elbowEndY = isTop ? start.y + cornerSize : start.y - cornerSize
            const sweep: 0 | 1 = isTop ? 1 : 0

            const d = [
              `M ${rel(start.x, start.y)}`,
              `H ${relX(hEndX)}`,
              arcRel(cornerSize, cornerSize, sweep, trunkX, elbowEndY),
            ].join(" ")
            sector2PathsOffset.push(d)
          })
          if (trunkPath) {
            sector2PathsOffset.push(`M ${rel(trunkX, trunkTop)} V ${relY(trunkBottom)}`)
          }

          // Sector 3: ewentualne przedłużenie pnia + łokieć + poziomy do meczu
          const sector3PathsOffset: string[] = []
          if (sector3ExtPath) {
            const parts = sector3ExtPath.split(" ")
            const x1 = trunkX
            const y1 = sector3ExtPath.includes("V") ? Number(parts[2]) : endY - cornerSize
            const y2 = Number(parts[parts.length - 1])
            sector3PathsOffset.push(`M ${rel(x1, y1)} V ${relY(y2)}`)
          }
          sector3PathsOffset.push(
            [
              `M ${rel(trunkX, endY - cornerSize)}`,
              arcRel(cornerSize, cornerSize, 1, trunkX + cornerSize, endY),
              `H ${relX(endX)}`,
            ].join(" "),
          )

          // Kropki (przesunięte)
          const dot = (x: number, y: number) => ({ cx: x - minX, cy: y - minY })

          return (
            <div
              key={`connector-group-${match.id}`}
              className="absolute pointer-events-none"
              style={{ zIndex: 1, left: `${minX}px`, top: `${minY}px`, width: `${width}px`, height: `${height}px` }}
              aria-hidden
            >
              <svg width={width} height={height}>
                {/* Sector 1: ścieżki lokalne */}
                {localPathsOffset.map((d, i) => (
                  <path
                    key={`s1-${match.id}-${i}`}
                    d={d}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Sector 2: wyjścia + pień */}
                {sector2PathsOffset.map((d, i) => (
                  <path
                    key={`s2-${match.id}-${i}`}
                    d={d}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Sector 3: przedłużenie (opcjonalnie) + łokieć + poziom do meczu */}
                {sector3PathsOffset.map((d, i) => (
                  <path
                    key={`s3-${match.id}-${i}`}
                    d={d}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Kropki startowe z lokalnych łączników */}
                {locals
                  .flatMap((l) => l.startDots)
                  .map((p, i) => {
                    const { cx, cy } = dot(p.x, p.y)
                    return <circle key={`sdot-${match.id}-${i}`} cx={cx} cy={cy} r={dotSize / 2} fill={lineColor} />
                  })}

                {/* Kropki w połowie lokalnych pni */}
                {locals.map((l, i) => {
                  const { cx, cy } = dot(l.midDot.x, l.midDot.y)
                  return <circle key={`mid-${match.id}-${i}`} cx={cx} cy={cy} r={dotSize / 2} fill={lineColor} />
                })}

                {/* Kropki przy wyjściach do wspólnego pnia */}
                {sector2Dots.map((p, i) => {
                  const { cx, cy } = dot(p.x, p.y)
                  return <circle key={`outdot-${match.id}-${i}`} cx={cx} cy={cy} r={dotSize / 2} fill={lineColor} />
                })}

                {/* Kropka na wspólnym pniu (jeśli są dwa wejścia) */}
                {/* trunkDot usunięty na prośbę: nie renderujemy kropki między sekcją 2 a 3 */}

                {/* Kropka na krawędzi meczu docelowego */}
                <circle cx={endX - minX} cy={endY - minY} r={dotSize / 2} fill={lineColor} />
              </svg>
            </div>
          )
        })}
    </>
  )
}
