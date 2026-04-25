import os
import glob
import sys

def compile_mdx_files(target_folder="", output_file="story_output.txt"):
    if not target_folder:
        target_folder = input("Which story folder would you like to compile? (e.g. 'museum-of-unbuilt-selves' or 'content/stories/museum-of-unbuilt-selves'): ")
        
    # If the user only gave the story name, map it to the full path
    if not os.path.exists(target_folder):
        potential_path = os.path.join("content", "stories", target_folder)
        if os.path.exists(potential_path):
            target_folder = potential_path
        else:
            print(f"Error: Folder '{target_folder}' (or '{potential_path}') does not exist.")
            return

    # Use glob to find all .mdx files within the target folder and subdirectories
    search_pattern = os.path.join(target_folder, "**/*.mdx")
    mdx_files = glob.glob(search_pattern, recursive=True)
    
    if not mdx_files:
        print(f"No .mdx files found in '{target_folder}'.")
        return

    chapter_range = input("Enter chapter range (e.g. '3-16') or leave empty for all: ").strip()

    # Try to sort logically by chapter numbers (if files like chapter1.mdx, chapter2.mdx)
    def extract_chapter_number(filepath):
        name = os.path.basename(filepath)
        # simplistic way to parse 'chapter10.mdx' -> 10
        import re
        nums = re.findall(r'\d+', name)
        return int(nums[0]) if nums else 0

    try:
        mdx_files.sort(key=extract_chapter_number)
    except:
        mdx_files.sort() # Fallback alphabetical sort

    # Filter based on chapter range
    if chapter_range:
        try:
            start_chap, end_chap = map(int, chapter_range.split('-'))
            mdx_files = [f for f in mdx_files if start_chap <= extract_chapter_number(f) <= end_chap]
        except ValueError:
            print("Invalid range format. Processing all chapters.")

    with open(output_file, 'w', encoding='utf-8') as outfile:
        for file_path in mdx_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    
                    # Write separator and file name
                    outfile.write("="*80 + "\n")
                    outfile.write(f"FILE: {file_path}\n")
                    outfile.write("="*80 + "\n\n")
                    
                    # Write the content
                    outfile.write(content)
                    outfile.write("\n\n")
                    
                print(f"Processed: {file_path}")
                
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                
    print(f"\nAll .mdx files have been compiled into '{output_file}'.")

if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else ""
    compile_mdx_files(folder)
