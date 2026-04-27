// ─── Pixel font 5×7 ──────────────────────────────────────────────────────────
const PIXEL_FONT: Record<string, number[][]> = {
  B: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
  U: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  I: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  L: [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  D: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
}

const WORD = 'BUILD'

function BuildPixelArt({ cell }: { cell: number }) {
  const cells: { row: number; col: number }[] = []
  let colOffset = 0
  for (const char of WORD) {
    const grid = PIXEL_FONT[char]
    if (!grid) { colOffset += 6; continue }
    const w = grid[0].length
    grid.forEach((row, ri) => {
      row.forEach((on, ci) => {
        if (on) cells.push({ row: ri, col: colOffset + ci })
      })
    })
    colOffset += w + 1
  }

  const maxCol = Math.max(...cells.map(c => c.col)) + 1

  return (
    <div
      className="relative"
      style={{ width: maxCol * cell, height: 7 * cell }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.row * cell,
            left: c.col * cell,
            width: cell,
            height: cell,
            background: '#CAFF32',
          }}
        />
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-zinc-950 overflow-hidden flex justify-center items-end">
      <BuildPixelArt cell={56} />
    </footer>
  )
}
