import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = '      {/* Main Content Area */}'
insertion = '''                </>
              )}
            </div>
          </div>
        </div>
      </div>
'''

if target in content:
    content = content.replace(target, insertion + target)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed missing tags.")
else:
    print("Target not found.")
