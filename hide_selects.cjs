const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    <select
                      value={pageStyle ?? "ruled"}`;

if (code.includes(target)) {
    const endStr = `                    </select>`;
    // find all three selects
    let selectIndex = code.indexOf(target);
    let thirdSelectEnd = code.indexOf(endStr, selectIndex);
    thirdSelectEnd = code.indexOf(endStr, thirdSelectEnd + 1);
    thirdSelectEnd = code.indexOf(endStr, thirdSelectEnd + 1);
    
    if (thirdSelectEnd !== -1) {
        const replacement = `{mode === "student" && (
                      <>
                        <select
                          value={pageStyle ?? "ruled"}
                          onChange={(e) => setPageStyle(e.target.value)}
                          className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                        >
                          <option value="plain">Plain Page</option>
                          <option value="ruled">Ruled Page</option>
                          <option value="box">Box Page</option>
                        </select>
                        <select
                          value={penColor ?? "blue"}
                          onChange={(e) => setPenColor(e.target.value)}
                          className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                        >
                          <option value="black">Black Pen</option>
                          <option value="blue">Blue Pen</option>
                        </select>
                        <select
                          value={handwritingFont ?? "font-handwriting"}
                          onChange={(e) => setHandwritingFont(e.target.value)}
                          className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                        >
                          <option value="font-handwriting">Caveat</option>
                          <option value="font-handwriting-indie">Indie Flower</option>
                          <option value="font-handwriting-kalam">Kalam</option>
                          <option value="font-handwriting-shadows">Shadows</option>
                          <option value="font-handwriting-patrick">Patrick</option>
                        </select>
                      </>
                    )}`;
        code = code.substring(0, selectIndex) + replacement + code.substring(thirdSelectEnd + endStr.length);
        fs.writeFileSync('src/App.tsx', code);
        console.log("Success");
    } else {
        console.log("Not found ends");
    }
} else {
    console.log("Not found target");
}
