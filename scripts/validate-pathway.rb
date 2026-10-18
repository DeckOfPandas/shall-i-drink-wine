# Checks _data/pathway.yml can be walked: every answer leads somewhere, every
# node can be reached, every route ends in a verdict within MAX_QUESTIONS
# questions, and the reveal board knows where to draw everything.
# Usage: ruby scripts/validate-pathway.rb [path/to/pathway.yml]
require "yaml"

MAX_QUESTIONS = 5
path = ARGV[0] || File.join(__dir__, "..", "_data", "pathway.yml")
data = YAML.safe_load(File.read(path))
errors = []

nodes = data["nodes"] || {}
start = data["start"]
layout = data.dig("reveal", "layout") || {}

errors << "start '#{start}' is not a node" unless nodes.key?(start)

%w[heading button].each do |key|
  errors << "landing.#{key} is missing" if data.dig("landing", key).to_s.strip.empty?
end
%w[button heading final_node restart route_intro].each do |key|
  errors << "reveal.#{key} is missing" if data.dig("reveal", key).to_s.strip.empty?
end
errors << "loading_lines is empty" if Array(data["loading_lines"]).empty?
errors << "reveal.layout has no position for final" unless layout.key?("final")

nodes.each do |id, node|
  errors << "#{id}: text is missing" if node["text"].to_s.strip.empty?
  errors << "#{id}: board_label is missing" if node["board_label"].to_s.strip.empty?
  pos = layout[id]
  unless pos.is_a?(Hash) && pos["col"].is_a?(Numeric) && pos["row"].is_a?(Numeric)
    errors << "#{id}: reveal.layout needs a numeric col and row"
  end

  case node["type"]
  when "question"
    options = Array(node["options"])
    errors << "#{id}: a question needs at least one option" if options.empty?
    options.each do |opt|
      errors << "#{id}: an option has no label" if opt["label"].to_s.strip.empty?
      errors << "#{id}: '#{opt["label"]}' points at '#{opt["next"]}', which is not a node" unless nodes.key?(opt["next"])
    end
  when "verdict"
    errors << "#{id}: a verdict has no options" if node.key?("options")
  else
    errors << "#{id}: type must be question or verdict, not '#{node["type"]}'"
  end
end

if errors.empty?
  # Every simple route from start, i.e. one that never revisits a node. The
  # loop back into another branch is fine as long as the walk can leave it.
  reached = {}
  routes = []
  walk = lambda do |id, trail|
    reached[id] = true
    node = nodes[id]
    return routes << trail + [id] if node["type"] == "verdict"

    nexts = node["options"].map { |o| o["next"] }.uniq
    open = nexts.reject { |n| trail.include?(n) || n == id }
    errors << "#{(trail + [id]).join(" → ")} can only loop back on itself" if open.empty?
    open.each { |n| walk.call(n, trail + [id]) }
  end
  walk.call(start, [])

  (nodes.keys - reached.keys).each { |id| errors << "#{id} cannot be reached from #{start}" }
  routes.each do |route|
    asked = route.count { |id| nodes[id]["type"] == "question" }
    errors << "#{route.join(" → ")} asks #{asked} questions; the limit is #{MAX_QUESTIONS}" if asked > MAX_QUESTIONS
  end
end

if errors.empty?
  puts "pathway OK: #{nodes.size} nodes, #{routes.size} routes, longest #{routes.map { |r| r.count { |id| nodes[id]["type"] == "question" } }.max} questions"
else
  warn errors.map { |e| "pathway: #{e}" }
  exit 1
end
