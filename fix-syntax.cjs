const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`                </button>
              </div>
            </div>
          )})();}`,
`                </button>
              </div>
            </div>
          )
          })()}`
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed!");
