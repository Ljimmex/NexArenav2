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
}

/**
 * Restored geometry with clear sector separation:
 * Sector 1: Individual Team Connections (teams connect to local trunk per match)
 * Sector 2: Individual Match Connections (local trunks connect to main trunk)
 * Sector 3: Final Connection to Next Match
 */
export const MatchConnectionLines: React.FC<MatchConnectionLinesProps> = ({
  layoutMatches,
  getMatchPosition,
  lineColor = "#a0a0a0",
  lineThickness = 3,
  cornerSize = 14,
  dotSize = 8,
  cardWidth = 320,
  cardHeight = 200,
  rowsPerMatch = 2,
  localGap = 12,
}) => {
  // === CONFIGURATION VARIABLES ===
  // Łatwe do edycji parametry dla dostosowania wyglądu linii

  // Geometry & Spacing
  const TRUNK_POSITION_RATIO = 0.5 // 0.5 = środek między local exits a target match
  const SECTOR2_INSET_ENABLED = true // czy używać inset dla trunk top/bottom
  const SECTOR3_STRAIGHT_CONNECTION = true // czy sektor 3 ma proste połączenie (bez łuku)

  // Visual Elements
  const SHOW_TEAM_START_DOTS = true
  const SHOW_LOCAL_TRUNK_DOTS = true
  const SHOW_SECTOR2_END_DOT = true
  const SHOW_TARGET_DOT = true

  // Line Styling
  const LINE_CAP_STYLE: "round" | "square" | "butt" = "round"
  const LINE_JOIN_STYLE: "round" | "miter" | "bevel" = "round"
  const SHAPE_RENDERING: "auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision" = "geometricPrecision"

  // Bounding Box
  const BOUNDING_BOX_PADDING = 24 // padding around the entire connection group

  // Sector-specific settings
  const SECTOR1_ROUNDED_CORNERS = true
  const SECTOR2_ROUNDED_CORNERS = true
  const SECTOR3_ROUNDED_CORNERS = false // obecnie ustawione na false dla prostego połączenia

  // Debug (set to true to see bounding boxes)
  const DEBUG_SHOW_BOUNDS = false

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
          const endY = Number.parseInt(endPos.top, 10) + cardHeight / 2

          const sameRound = layoutMatches.filter((m) => m.round === match.round && !m.is_bronze_match)
          const matchIndex = sameRound.findIndex((m) => m.id === match.id)
          const startIdx = matchIndex * 2
          const connectedMatches = prevRound.slice(startIdx, startIdx + 2)
          if (connectedMatches.length === 0) return null

          // SECTOR 1: Individual Team Connections (to local trunks)
          // Each team connects to its match's local trunk
          type TeamConnection = {
            teamId: string
            matchId: string
            rowIndex: number
            startPoint: { x: number; y: number }
            path: string
            localTrunkX: number
            localMidY: number
          }

          const teamConnections: TeamConnection[] = []

          connectedMatches.forEach((cm, matchIdx) => {
            const cp = getMatchPosition(cm)
            const left = Number.parseInt(cp.left, 10)
            const top = Number.parseInt(cp.top, 10)
            const xCardRight = left + cardWidth
            const localTrunkX = xCardRight + localGap + cornerSize

            const centers = rowCenters(top)
            const topY = Math.min(...centers)
            const bottomY = Math.max(...centers)
            const midY = (topY + bottomY) / 2

            centers.forEach((y, rowIdx) => {
              const teamId = `${cm.id}-team-${rowIdx}`
              const startPoint = { x: xCardRight, y }

              // H do (localTrunkX - corner), łuk do pnia, V do środka
              const hEndX = localTrunkX - cornerSize
              const isTopRow = y === topY
              const elbowEndY = isTopRow ? y + cornerSize : y - cornerSize
              const sweep: 0 | 1 = isTopRow ? 1 : 0

              const path = [
                `M ${xCardRight} ${y}`,
                `H ${hEndX}`,
                arcTo(cornerSize, cornerSize, sweep, localTrunkX, elbowEndY),
                `V ${midY}`,
              ].join(" ")

              teamConnections.push({
                teamId,
                matchId: cm.id,
                rowIndex: rowIdx,
                startPoint,
                path,
                localTrunkX,
                localMidY: midY,
              })
            })
          })

          // SECTOR 2: Individual Match Connections (local trunks to main trunk)
          // Each match's local trunk connects to the main trunk
          type MatchConnection = {
            matchId: string
            localExitPoint: { x: number; y: number }
            trunkConnectionPoint: { x: number; y: number }
            path: string
          }

          const matchConnections: MatchConnection[] = []

          // Calculate main trunk position
          const localExits = connectedMatches.map((cm, idx) => {
            const tc = teamConnections.find((t) => t.matchId === cm.id && t.rowIndex === 0)
            return { x: tc!.localTrunkX, y: tc!.localMidY }
          })

          const minExitX = Math.min(...localExits.map((e) => e.x))
          const topExitY = Math.min(...localExits.map((e) => e.y))
          const bottomExitY = Math.max(...localExits.map((e) => e.y))

          const trunkX = minExitX + (endX - minExitX) * TRUNK_POSITION_RATIO
          const sector2Inset = localExits.length > 1 && SECTOR2_INSET_ENABLED ? cornerSize : 0
          const trunkTop = topExitY + sector2Inset
          const trunkBottom = bottomExitY - sector2Inset

          localExits.forEach((exitPoint, idx) => {
            const matchId = connectedMatches[idx].id
            const hEndX = trunkX - cornerSize
            const isTop = exitPoint.y === topExitY
            const elbowEndY = isTop ? exitPoint.y + cornerSize : exitPoint.y - cornerSize
            const sweep: 0 | 1 = isTop ? 1 : 0
            const trunkConnectionPoint = { x: trunkX, y: elbowEndY }

            const path = [
              `M ${exitPoint.x} ${exitPoint.y}`,
              `H ${hEndX}`,
              arcTo(cornerSize, cornerSize, sweep, trunkX, elbowEndY),
            ].join(" ")

            matchConnections.push({
              matchId,
              localExitPoint: exitPoint,
              trunkConnectionPoint,
              path,
            })
          })

          // SECTOR 2 kończy się jedną kropką na środku głównego pnia
          const sector2EndDot = { x: trunkX, y: (trunkTop + trunkBottom) / 2 }

          // SECTOR 3: Final Connection to Next Match
          const sector3Paths: string[] = []
          const sector3StartY = (trunkTop + trunkBottom) / 2

          // Prosty pionowy pień od góry do środka
          if (sector3StartY > trunkTop) {
            sector3Paths.push(`M ${trunkX} ${trunkTop} V ${sector3StartY}`)
          }

          // Prosty pionowy pień od środka do dołu
          if (trunkBottom > sector3StartY) {
            sector3Paths.push(`M ${trunkX} ${sector3StartY} V ${trunkBottom}`)
          }

          // Połączenie do meczu docelowego - proste lub z łukiem
          if (SECTOR3_STRAIGHT_CONNECTION) {
            sector3Paths.push(`M ${trunkX} ${sector3StartY} H ${endX}`)
          } else {
            sector3Paths.push(
              [
                `M ${trunkX} ${sector3StartY}`,
                arcTo(cornerSize, cornerSize, 1, trunkX + cornerSize, sector3StartY),
                `H ${endX}`,
              ].join(" "),
            )
          }

          // Calculate bounding box
          const xCandidates: number[] = [endX, trunkX, trunkX + cornerSize]
          const yCandidates: number[] = [endY, endY - cornerSize, trunkTop, trunkBottom]

          teamConnections.forEach((tc) => {
            xCandidates.push(tc.startPoint.x, tc.localTrunkX - cornerSize, tc.localTrunkX)
            yCandidates.push(tc.startPoint.y, tc.localMidY)
          })

          matchConnections.forEach((mc) => {
            xCandidates.push(mc.localExitPoint.x, trunkX - cornerSize)
            yCandidates.push(mc.localExitPoint.y, mc.trunkConnectionPoint.y)
          })

          const minX = Math.min(...xCandidates) - BOUNDING_BOX_PADDING
          const maxX = Math.max(...xCandidates) + BOUNDING_BOX_PADDING
          const minY = Math.min(...yCandidates) - BOUNDING_BOX_PADDING
          const maxY = Math.max(...yCandidates) + BOUNDING_BOX_PADDING
          const width = Math.max(0, maxX - minX)
          const height = Math.max(0, maxY - minY)

          // Helper functions for local coordinates
          const rel = (x: number, y: number) => `${x - minX} ${y - minY}`
          const relX = (x: number) => `${x - minX}`
          const relY = (y: number) => `${y - minY}`
          const arcRel = (rx: number, ry: number, sweep: 0 | 1, x: number, y: number) =>
            `A ${rx} ${ry} 0 0 ${sweep} ${x - minX} ${y - minY}`

          // Convert paths to local coordinates
          const teamPathsLocal = teamConnections.map((tc) => {
            const parts = tc.path.split(" ")
            const hEndX = tc.localTrunkX - cornerSize
            const isTopRow = tc.rowIndex === 0
            const elbowEndY = isTopRow ? tc.startPoint.y + cornerSize : tc.startPoint.y - cornerSize
            const sweep: 0 | 1 = isTopRow ? 1 : 0

            return [
              `M ${rel(tc.startPoint.x, tc.startPoint.y)}`,
              `H ${relX(hEndX)}`,
              arcRel(cornerSize, cornerSize, sweep, tc.localTrunkX, elbowEndY),
              `V ${relY(tc.localMidY)}`,
            ].join(" ")
          })

          const matchPathsLocal = matchConnections.map((mc) => {
            const hEndX = trunkX - cornerSize
            const isTop = mc.localExitPoint.y === topExitY
            const elbowEndY = isTop ? mc.localExitPoint.y + cornerSize : mc.localExitPoint.y - cornerSize
            const sweep: 0 | 1 = isTop ? 1 : 0

            return [
              `M ${rel(mc.localExitPoint.x, mc.localExitPoint.y)}`,
              `H ${relX(hEndX)}`,
              arcRel(cornerSize, cornerSize, sweep, trunkX, elbowEndY),
            ].join(" ")
          })

          const sector3PathsLocal = sector3Paths.map((path) => {
            const parts = path.split(" ")
            if (parts[0] === "M" && parts[3] === "V") {
              return `M ${rel(Number.parseInt(parts[1], 10), Number.parseInt(parts[2], 10))} V ${relY(Number.parseInt(parts[4], 10))}`
            } else if (parts[0] === "M" && parts[3] === "H") {
              // Proste połączenie poziome
              return `M ${rel(Number.parseInt(parts[1], 10), Number.parseInt(parts[2], 10))} H ${relX(Number.parseInt(parts[4], 10))}`
            }
            return path
          })

          return (
            <div
              key={`connector-group-${match.id}`}
              className="absolute pointer-events-none"
              style={{ zIndex: 1, left: `${minX}px`, top: `${minY}px`, width: `${width}px`, height: `${height}px` }}
              aria-hidden
            >
              <svg
                width={width}
                height={height}
                shapeRendering={SHAPE_RENDERING}
                style={DEBUG_SHOW_BOUNDS ? { border: "1px solid red", background: "rgba(255,0,0,0.1)" } : undefined}
              >
                {/* SECTOR 1: Individual Team Connections to Local Trunks */}
                {teamPathsLocal.map((path, i) => (
                  <g key={`team-${match.id}-${i}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={lineThickness}
                      strokeLinecap={LINE_CAP_STYLE}
                      strokeLinejoin={LINE_JOIN_STYLE}
                    />
                  </g>
                ))}

                {/* SECTOR 2: Individual Match Connections to Main Trunk */}
                {matchPathsLocal.map((path, i) => (
                  <g key={`match-${match.id}-${i}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={lineThickness}
                      strokeLinecap={LINE_CAP_STYLE}
                      strokeLinejoin={LINE_JOIN_STYLE}
                    />
                  </g>
                ))}

                {/* Sector 2 end dot - jedna kropka na środku głównego pnia */}
                {SHOW_SECTOR2_END_DOT && (
                  <circle cx={sector2EndDot.x - minX} cy={sector2EndDot.y - minY} r={dotSize / 2} fill={lineColor} />
                )}

                {/* SECTOR 3: Final Connection to Next Match */}
                {sector3PathsLocal.map((path, i) => (
                  <path
                    key={`final-${match.id}-${i}`}
                    d={path}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness}
                    strokeLinecap={LINE_CAP_STYLE}
                    strokeLinejoin={LINE_JOIN_STYLE}
                  />
                ))}

                {/* Team start dots */}
                {SHOW_TEAM_START_DOTS &&
                  teamConnections.map((tc, i) => (
                    <circle
                      key={`team-dot-${match.id}-${i}`}
                      cx={tc.startPoint.x - minX}
                      cy={tc.startPoint.y - minY}
                      r={dotSize / 2}
                      fill={lineColor}
                    />
                  ))}

                {/* Local trunk mid dots */}
                {SHOW_LOCAL_TRUNK_DOTS &&
                  connectedMatches.map((cm, i) => {
                    const tc = teamConnections.find((t) => t.matchId === cm.id && t.rowIndex === 0)
                    return (
                      <circle
                        key={`local-mid-dot-${match.id}-${i}`}
                        cx={tc!.localTrunkX - minX}
                        cy={tc!.localMidY - minY}
                        r={dotSize / 2}
                        fill={lineColor}
                      />
                    )
                  })}

                {/* Final target dot */}
                {SHOW_TARGET_DOT && (
                  <circle cx={endX - minX} cy={sector3StartY - minY} r={dotSize / 2} fill={lineColor} />
                )}
              </svg>
            </div>
          )
        })}
    </>
  )
}
