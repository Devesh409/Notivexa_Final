import React, { useState, useRef } from 'react';
import { Download, Plus, Trash2, Printer, FileText } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

export interface PaperData {
  collegeName: string;
  accreditation: string;
  examName: string;
  department: string;
  branch: string;
  semester: string;
  subject: string;
  time: string;
  date: string;
  maxMarks: number | string;
  subjectCode: string;
  instructions: string[];
  questions: {
    id: string;
    type: 'main' | 'sub';
    qNo: string;
    text: string;
    marks: string;
    bt: string;
    co: string;
  }[];
  footer: string;
}

interface Props {
  initialData: PaperData;
}

export function UniversityPaperEditor({ initialData }: Props) {
  const [data, setData] = useState<PaperData>(() => {
    // Ensure unique IDs for questions
    const withIds = { ...initialData };
    withIds.questions = (withIds.questions || []).map((q, i) => ({
      ...q,
      id: q.id || `q-${Date.now()}-${i}`,
    }));
    return withIds;
  });
  const [isHoveredId, setIsHoveredId] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleFieldChange = (field: keyof PaperData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInst = [...data.instructions];
    newInst[index] = value;
    setData((prev) => ({ ...prev, instructions: newInst }));
  };

  const handleQuestionChange = (id: string, field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    }));
  };

  const addQuestionRow = (index: number, type: 'main' | 'sub') => {
    const newRow = {
      id: `q-${Date.now()}`,
      type,
      qNo: type === 'main' ? 'Q.' : 'a)',
      text: type === 'main' ? 'Attempt any 3' : '',
      marks: type === 'main' ? '' : '5',
      bt: type === 'main' ? '' : '1',
      co: type === 'main' ? '' : '1',
    };
    const newQuestions = [...data.questions];
    newQuestions.splice(index + 1, 0, newRow);
    setData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const removeQuestionRow = (id: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const addInstruction = () => {
    setData((prev) => ({ ...prev, instructions: [...prev.instructions, 'New instruction'] }));
  };

  const removeInstruction = (index: number) => {
    const newInst = [...data.instructions];
    newInst.splice(index, 1);
    setData((prev) => ({ ...prev, instructions: newInst }));
  };

  const downloadPDF = async () => {
    if (!paperRef.current) return;
    try {
      // Temporarily hide the UI buttons that shouldn't be printed
      const buttons = paperRef.current.querySelectorAll('.no-print');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      const imgData = await htmlToImage.toPng(paperRef.current, { pixelRatio: 2 });
      
      // Restore the buttons
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Get actual dimensions to calculate height correctly
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.subject}_QuestionPaper.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const downloadDocx = () => {
    if (!paperRef.current) return;
    // We create a basic HTML string with a meta tag for word compatibility
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
    const footer = "</body></html>";
    // We don't want to include the UI buttons (plus, trash) in the print
    const clone = paperRef.current.cloneNode(true) as HTMLElement;
    const buttons = clone.querySelectorAll('.no-print');
    buttons.forEach(btn => btn.remove());
    
    const htmlString = header + clone.innerHTML + footer;
    const blob = new Blob(['\ufeff', htmlString], {
      type: 'application/msword',
    });
    saveAs(blob, `${data.subject}_QuestionPaper.doc`);
  };

  const calculateTotalMarks = () => {
    return data.questions
      .filter((q) => q.type === 'sub')
      .reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 items-center overflow-y-auto p-4 md:p-8">
      {/* Toolbar */}
      <div className="w-full max-w-[210mm] mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Total Marks (Subquestions)</p>
            <p className="text-2xl font-bold text-gray-900">{calculateTotalMarks()} <span className="text-sm font-normal text-gray-500">/ {data.maxMarks} (Max)</span></p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={downloadDocx}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Word (DOC)</span>
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Paper Editor Container */}
      <div 
        ref={paperRef}
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-lg relative print:shadow-none print:m-0 print:p-0"
        style={{ fontFamily: "'Times New Roman', serif" }}
      >
        <div className="p-8 pb-12 w-full h-full relative" style={{ boxSizing: 'border-box' }}>
          
          {/* Main Border Container exactly like image */}
          <div className="border border-black w-full h-full flex flex-col">
            
            {/* Header Section */}
            <div className="text-center p-2 border-b border-black flex flex-col items-center relative">
              <input 
                className="font-bold text-lg text-center w-full bg-transparent outline-none uppercase" 
                value={data.collegeName} 
                onChange={(e) => handleFieldChange('collegeName', e.target.value)} 
              />
              <input 
                className="text-sm text-center w-full bg-transparent outline-none" 
                value={data.accreditation} 
                onChange={(e) => handleFieldChange('accreditation', e.target.value)} 
              />
              <input 
                className="font-bold text-base mt-1 text-center w-full bg-transparent outline-none uppercase" 
                value={data.examName} 
                onChange={(e) => handleFieldChange('examName', e.target.value)} 
              />
              <input 
                className="text-sm mt-1 text-center w-full bg-transparent outline-none" 
                value={data.department} 
                onChange={(e) => handleFieldChange('department', e.target.value)} 
              />
            </div>

            {/* Info Grid */}
            <div className="w-full grid grid-cols-2 text-sm">
              <div className="border-b border-r border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Branch: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.branch} onChange={(e) => handleFieldChange('branch', e.target.value)} />
              </div>
              <div className="border-b border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Semester: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.semester} onChange={(e) => handleFieldChange('semester', e.target.value)} />
              </div>
              
              <div className="border-b border-r border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Subject: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.subject} onChange={(e) => handleFieldChange('subject', e.target.value)} />
              </div>
              <div className="border-b border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Time: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.time} onChange={(e) => handleFieldChange('time', e.target.value)} />
              </div>
              
              <div className="border-b border-r border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Max. Marks: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.maxMarks} onChange={(e) => handleFieldChange('maxMarks', e.target.value)} />
              </div>
              <div className="border-b border-black p-1 flex">
                <span className="font-bold whitespace-nowrap">Date: </span>
                <input className="ml-1 flex-1 bg-transparent outline-none" value={data.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
              </div>
            </div>

            {/* Instructions */}
            <div className="p-2 border-b border-black flex justify-between relative group">
              <div className="text-sm font-bold flex-1">
                <div>N.B.</div>
                {data.instructions.map((inst, idx) => (
                  <div key={idx} className="flex group/inst">
                    <span className="mr-1">{idx + 1}.</span>
                    <input 
                      className="flex-1 bg-transparent outline-none" 
                      value={inst} 
                      onChange={(e) => handleInstructionChange(idx, e.target.value)} 
                    />
                    <button onClick={() => removeInstruction(idx)} className="no-print opacity-0 group-hover/inst:opacity-100 text-red-500 ml-2">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={addInstruction} className="no-print opacity-0 group-hover:opacity-100 text-blue-500 text-xs flex items-center mt-1">
                  <Plus className="w-3 h-3 mr-1" /> Add Instruction
                </button>
              </div>
              <div className="text-sm flex items-start">
                <span className="font-bold whitespace-nowrap">Subject Code: </span>
                <input className="ml-1 bg-transparent outline-none w-24 text-right" value={data.subjectCode} onChange={(e) => handleFieldChange('subjectCode', e.target.value)} />
              </div>
            </div>

            {/* Question Table Header */}
            <div className="w-full flex text-center font-bold text-sm border-b border-black bg-gray-50 print:bg-transparent">
              <div className="w-[8%] border-r border-black p-1">Q.No</div>
              <div className="w-[68%] border-r border-black p-1">Question</div>
              <div className="w-[8%] border-r border-black p-1">M</div>
              <div className="w-[8%] border-r border-black p-1">BT</div>
              <div className="w-[8%] p-1">CO</div>
            </div>

            {/* Question Table Body */}
            <div className="w-full flex-1 flex flex-col text-sm">
              {data.questions.map((q, idx) => (
                <div 
                  key={q.id} 
                  className={`w-full flex border-b border-black relative group/row ${q.type === 'main' ? 'bg-gray-50 print:bg-transparent font-bold' : ''}`}
                  onMouseEnter={() => setIsHoveredId(q.id)}
                  onMouseLeave={() => setIsHoveredId(null)}
                >
                  <div className="w-[8%] border-r border-black p-1 text-center font-bold">
                    <input 
                      className="w-full bg-transparent outline-none text-center" 
                      value={q.qNo} 
                      onChange={(e) => handleQuestionChange(q.id, 'qNo', e.target.value)} 
                    />
                  </div>
                  <div className="w-[68%] border-r border-black p-1 flex items-start h-full">
                    <textarea 
                      className="w-full bg-transparent outline-none resize-none overflow-hidden block" 
                      value={q.text} 
                      rows={Math.max(1, q.text.split('\n').length)}
                      onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} 
                      style={{ height: 'auto' }}
                    />
                  </div>
                  <div className="w-[8%] border-r border-black p-1 text-center flex items-center justify-center">
                    <input 
                      className="w-full bg-transparent outline-none text-center" 
                      value={q.marks} 
                      onChange={(e) => handleQuestionChange(q.id, 'marks', e.target.value)} 
                    />
                  </div>
                  <div className="w-[8%] border-r border-black p-1 text-center flex items-center justify-center">
                    <input 
                      className="w-full bg-transparent outline-none text-center" 
                      value={q.bt} 
                      onChange={(e) => handleQuestionChange(q.id, 'bt', e.target.value)} 
                    />
                  </div>
                  <div className="w-[8%] p-1 text-center flex items-center justify-center relative">
                    <input 
                      className="w-full bg-transparent outline-none text-center" 
                      value={q.co} 
                      onChange={(e) => handleQuestionChange(q.id, 'co', e.target.value)} 
                    />
                    
                    {/* Action Menu (Visible on Hover) */}
                    {isHoveredId === q.id && (
                      <div className="no-print absolute top-0 -right-24 bg-white border shadow-md rounded flex z-10 p-1 space-x-1">
                        <button 
                          onClick={() => addQuestionRow(idx, 'sub')}
                          title="Add Subquestion"
                          className="p-1 hover:bg-gray-100 text-blue-600 rounded"
                        >
                          <span className="text-xs font-bold">+a)</span>
                        </button>
                        <button 
                          onClick={() => addQuestionRow(idx, 'main')}
                          title="Add Main Question"
                          className="p-1 hover:bg-gray-100 text-green-600 rounded"
                        >
                          <span className="text-xs font-bold">+Q</span>
                        </button>
                        <button 
                          onClick={() => removeQuestionRow(q.id)}
                          title="Remove Row"
                          className="p-1 hover:bg-gray-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
          
          {/* Footer Text outside the main border but bottom aligned */}
          <div className="mt-2 text-xs">
            <textarea 
              className="w-full bg-transparent outline-none resize-none" 
              value={data.footer}
              onChange={(e) => handleFieldChange('footer', e.target.value)}
              rows={4}
            />
          </div>
          
        </div>
      </div>
      
      {/* Styles for print */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
