require 'xcodeproj'

project_path = 'MamaAir.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target
target_name = 'MamaAir'
target = project.targets.find { |t| t.name == target_name }

if target.nil?
  puts "Target #{target_name} not found!"
  exit 1
end

# Find the main group (usually named after the project)
group_name = 'MamaAir'
group = project.main_group.find_subpath(group_name, true)

if group.nil?
  puts "Group #{group_name} not found!"
  # Fallback to main group if subpath not found, but usually it exists
  group = project.main_group
end

# File path relative to the project root
file_path = 'MamaAir/GoogleService-Info.plist'

# check if file reference already exists to avoid duplicates
file_ref = group.files.find { |f| f.path == 'GoogleService-Info.plist' }

if file_ref
  puts "File reference already exists in group."
else
  # Add the file to the group
  # Note: new_file automatically sets the path relative to the group if possible
  # But here the group path is 'MamaAir', so adding 'GoogleService-Info.plist' to it
  # should result in 'MamaAir/GoogleService-Info.plist' full path.
  # However, Xcodeproj's new_file takes a path relative to the project root or absolute path.
  # Let's use the file system path.
  file_ref = group.new_file('GoogleService-Info.plist') 
  puts "Added file reference to group #{group.name}"
end

# Add to Copy Bundle Resources phase
resources_phase = target.resources_build_phase
build_file = resources_phase.files.find { |f| f.file_ref && f.file_ref.path == 'GoogleService-Info.plist' }

if build_file
  puts "File already in Copy Bundle Resources phase."
else
  resources_phase.add_file_reference(file_ref)
  puts "Added file to Copy Bundle Resources phase."
end

project.save
puts "Project saved."
