import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                  </button>
              )}
            </div>''',
'''                  </button>
                </>
              )}
            </div>''')

with open('src/App.tsx', 'w') as f:
    f.write(content)
