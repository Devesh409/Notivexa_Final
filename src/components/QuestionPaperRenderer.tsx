
import React from 'react';

export interface Question {
  id: string;
  text: string;
  marks: string;
  co: string;
  bl: string;
}

export interface Section {
  title: string;
  description: string;
  questions: Question[];
}

export interface QuestionPaperData {
  institution: string;
  department: string;
  examTitle: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  duration: string;
  marks: string;
  note: string;
  sections: Section[];
}

interface QuestionPaperRendererProps {
  data: QuestionPaperData;
}

export const QuestionPaperRenderer: React.FC<QuestionPaperRendererProps> = ({ data }) => {
  return (
    <div className="bg-white p-8 text-black font-serif text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 border border-black flex items-center justify-center text-[8px]">LOGO</div>
        <div className="text-center flex-grow">
          <h1 className="font-bold text-base">Mahatma Education Society's</h1>
          <h1 className="font-bold text-lg">{data.institution}</h1>
          <h2 className="font-semibold">{data.department}</h2>
          <h3 className="font-semibold underline">{data.examTitle}</h3>
        </div>
      </div>
      
      {/* Details */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div><strong>Subject:</strong> {data.subject}</div>
        <div><strong>Class:</strong> {data.class}</div>
        <div><strong>Date:</strong> {data.date}</div>
        <div><strong>Time:</strong> {data.time}</div>
        <div><strong>Duration:</strong> {data.duration}</div>
        <div><strong>Marks:</strong> {data.marks}</div>
      </div>
      
      {/* Note */}
      <div className="border border-black p-2 mb-4">
        <strong>Note:</strong> {data.note}
      </div>

      {/* Questions Table */}
      <table className="w-full border-collapse border border-black mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-3/5">Questions</th>
            <th className="border border-black p-2 w-1/5">Marks</th>
            <th className="border border-black p-2 w-1/10">Course Outcome</th>
            <th className="border border-black p-2 w-1/10">Bloom's Level</th>
          </tr>
        </thead>
        <tbody>
          {(data?.sections || []).map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              <tr>
                <td colSpan={4} className="border border-black p-2 font-bold bg-gray-50">
                  [ {sIdx + 1} ] {section.title} - {section.description}
                </td>
              </tr>
              {(section?.questions || []).map((q, qIdx) => (
                <tr key={qIdx}>
                  <td className="border border-black p-2">
                    {String.fromCharCode(65 + qIdx)}. {q.text}
                  </td>
                  <td className="border border-black p-2 text-center">[ {q.marks} ]</td>
                  <td className="border border-black p-2 text-center">{q.co}</td>
                  <td className="border border-black p-2 text-center">{q.bl}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      {/* Footer Explanation */}
      <div className="text-xs italic">
        <p>CO: Course Outcome mapping</p>
        <p>BL: Bloom's Taxonomy Level</p>
      </div>
    </div>
  );
};
