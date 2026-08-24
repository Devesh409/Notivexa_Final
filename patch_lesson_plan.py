import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We need to replace the section from {resultType === "lesson-plan" && lessonPlan && (
# to the end of the lesson-plan block.
# Let's find the boundaries.
start_str = '{resultType === "lesson-plan" && lessonPlan && ('
end_str = "                {/* \n                  Applying a handwriting font class when in student mode."

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
else:
    new_html = """{resultType === "lesson-plan" && lessonPlan && (
                  <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-blue-50/80 pointer-events-none"></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                      <div className="bg-white border border-orange-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3.5 bg-gradient-to-br from-orange-100 to-amber-100 text-amber-600 rounded-2xl shadow-inner">
                          <Clock size={24} className="opacity-80" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completion Duration</p>
                          <p className="text-lg font-bold text-slate-800">{lessonPlan.duration || "N/A"}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3.5 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl shadow-inner">
                          <BookOpen size={24} className="opacity-80" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
                          <p className="text-lg font-bold text-slate-800">{lessonPlan.totalSessions || `${lessonPlan.sessions?.length || 0} Sessions`}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Syllabus Progress</p>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {Math.round((Object.values(completedSessions).filter(Boolean).length / (lessonPlan.sessions?.length || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-700 ease-out"
                            style={{ width: `${(Object.values(completedSessions).filter(Boolean).length / (lessonPlan.sessions?.length || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right font-medium">
                          <span className="text-slate-700 font-bold">{Object.values(completedSessions).filter(Boolean).length}</span> of {lessonPlan.sessions?.length || 0} completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shadow-inner">
                        <Calendar size={20} />
                      </div>
                      <h4 className="font-serif text-2xl font-bold text-slate-800">
                        Interactive Lesson Timeline
                      </h4>
                    </div>
                      
                    <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 space-y-10 pb-4 z-10">
                      {lessonPlan.sessions?.map((session, sIdx) => {
                        const isCompleted = !!completedSessions[sIdx];
                        return (
                          <div key={sIdx} className="relative pl-8 md:pl-10">
                            {/* Checkbox Node */}
                            <div 
                              onClick={() => setCompletedSessions(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                              className={`absolute -left-[17px] top-4 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 scale-110 shadow-emerald-200' 
                                  : 'bg-slate-100 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:scale-105'
                              }`}
                            >
                              {isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            
                            {/* Content Card */}
                            <div 
                              onClick={() => setCompletedSessions(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                              className={`group rounded-2xl p-6 transition-all duration-300 cursor-pointer text-left border ${
                                isCompleted 
                                  ? 'bg-slate-50/80 border-slate-200 shadow-none opacity-80' 
                                  : 'bg-white border-slate-200 shadow-lg shadow-indigo-100/20 hover:shadow-xl hover:shadow-indigo-100/40 hover:border-indigo-300 hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4 flex-wrap mb-3">
                                <h5 className={`font-bold text-lg leading-tight ${
                                  isCompleted ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-indigo-900 transition-colors'
                                }`}>
                                  {session.name}
                                </h5>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm ${
                                  isCompleted ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {session.duration}
                                </span>
                              </div>
                              
                              <p className={`text-sm leading-relaxed mb-5 ${
                                isCompleted ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {session.description}
                              </p>
                                
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {session.objectives && session.objectives.length > 0 && (
                                  <div className={`rounded-xl p-4 transition-colors ${
                                    isCompleted ? 'bg-slate-100/50' : 'bg-amber-50/50 border border-amber-100/50'
                                  }`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${
                                      isCompleted ? 'text-slate-400' : 'text-amber-700'
                                    }`}>
                                      <Target size={14} /> Learning Objectives
                                    </p>
                                    <ul className={`list-none space-y-2 text-sm ${
                                      isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'
                                    }`}>
                                      {session.objectives.map((obj, oIdx) => (
                                        <li key={oIdx} className="flex items-start gap-2.5">
                                          <span className="text-amber-400 mt-0.5">•</span>
                                          <span className="flex-1 leading-snug">{obj}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {session.activities && session.activities.length > 0 && (
                                  <div className={`rounded-xl p-4 transition-colors ${
                                    isCompleted ? 'bg-slate-100/50' : 'bg-blue-50/50 border border-blue-100/50'
                                  }`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${
                                      isCompleted ? 'text-slate-400' : 'text-blue-700'
                                    }`}>
                                      <Activity size={14} /> Session Activities
                                    </p>
                                    <ul className={`list-none space-y-2 text-sm ${
                                      isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'
                                    }`}>
                                      {session.activities.map((act, aIdx) => (
                                        <li key={aIdx} className="flex items-start gap-2.5">
                                          <span className="text-blue-500 font-mono text-[10px] bg-blue-100 px-1.5 py-0.5 rounded-md mt-0.5">{aIdx + 1}</span>
                                          <span className="flex-1 leading-snug">{act}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
"""

    content = content[:start_idx] + new_html + content[end_idx:]
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Lesson plan patched successfully!")
