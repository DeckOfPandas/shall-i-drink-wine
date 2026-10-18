# Writes _includes/brick-wall.svg, a running-bond tile of 6 rows, each brick
# a shade picked so it never matches its left or upper neighbour. The shades
# themselves are --brick-1 to --brick-4 in the palette. Run from the project
# root: ruby scripts/brick-wall.rb
W, H, PX, PY, BW, BH = 318, 162, 53, 27, 50, 24
rng = Random.new(11)
rows = []
rects = []
6.times do |r|
  offset = r.odd? ? -26.5 : 0
  count = r.odd? ? 7 : 6
  row = []
  count.times do |i|
    # The last brick of an odd row is the other half of its first.
    if r.odd? && i == count - 1
      row << row[0]
    else
      banned = [row[-1], (rows[-1] || [])[i]].compact
      row << ([1, 2, 3, 4] - banned).sample(random: rng)
    end
    x = offset + i * PX
    rects << %(<rect class="b#{row[-1]}" x="#{x}" y="#{r * PY}" width="#{BW}" height="#{BH}"/>)
  end
  rows << row
end
svg = <<~SVG
  <svg class="wall" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="bricks" width="#{W}" height="#{H}" patternUnits="userSpaceOnUse"><rect class="mortar" width="#{W}" height="#{H}"/>#{rects.join}</pattern></defs><rect width="100%" height="100%" fill="url(#bricks)"/></svg>
SVG
File.write("_includes/brick-wall.svg", svg)
