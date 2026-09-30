import React, { useState, useRef } from 'react';
import { Upload, UserCircle, CheckCircle2, AlertTriangle, Check, FileText, Loader2, ArrowLeft, Table, Printer } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Data model
type FieldStatus = 'Verified' | 'Review Needed';
type DisplayLang = 'en' | 'hi';

interface ExtractedField {
  id: string;
  labelEn: string;
  labelHi: string;
  value: string;
  value_hi: string;
  confidence: number;
  status: FieldStatus;
  box2d?: [number, number, number, number];
  page_number?: number;
}

interface Record {
  id: string;
  fields: ExtractedField[];
  date: string;
  // Summary for table
  khasraNo: string;
  khasraNo_hi: string;
  khatauniNo: string;
  khatauniNo_hi: string;
  name: string;
  name_hi: string;
  area: string;
  area_hi: string;
  village: string;
  village_hi: string;
}

const initialFields: ExtractedField[] = [
  { id: 'f1', labelEn: 'Plot / Khasra No.', labelHi: 'खसरा संख्या', value: '128/4A', value_hi: '128/4A', confidence: 98, status: 'Verified' },
  { id: 'f2', labelEn: 'Register / Khatauni No.', labelHi: 'खतौनी संख्या', value: '45-B', value_hi: '45-B', confidence: 95, status: 'Verified' },
  { id: 'f3', labelEn: 'Landholder Name', labelHi: 'खातेदार का नाम', value: 'Ramesh Kumar', value_hi: 'रमेश कुमार', confidence: 90, status: 'Verified' },
  { id: 'f4', labelEn: 'Land Area / Extent', labelHi: 'क्षेत्रफल', value: '2.5 Acres', value_hi: '2.5 एकड़', confidence: 62, status: 'Review Needed' },
  { id: 'f5', labelEn: 'Village / Revenue Circle', labelHi: 'मौजा / ग्राम', value: 'Rampur Mauza', value_hi: 'रामपुर मौजा', confidence: 92, status: 'Verified' },
];

const mockFieldsRecord1: ExtractedField[] = [
  { id: 'f1', labelEn: 'Plot / Khasra No.', labelHi: 'खसरा संख्या', value: '102/2', value_hi: '102/2', confidence: 99, status: 'Verified' },
  { id: 'f2', labelEn: 'Register / Khatauni No.', labelHi: 'खतौनी संख्या', value: '14-A', value_hi: '14-A', confidence: 99, status: 'Verified' },
  { id: 'f3', labelEn: 'Landholder Name', labelHi: 'खातेदार का नाम', value: 'Sita Ram', value_hi: 'सीता राम', confidence: 99, status: 'Verified' },
  { id: 'f4', labelEn: 'Land Area / Extent', labelHi: 'क्षेत्रफल', value: '1.2 Acres', value_hi: '1.2 एकड़', confidence: 99, status: 'Verified' },
  { id: 'f5', labelEn: 'Village / Revenue Circle', labelHi: 'मौजा / ग्राम', value: 'Rampur Mauza', value_hi: 'रामपुर मौजा', confidence: 99, status: 'Verified' },
];

const mockFieldsRecord2: ExtractedField[] = [
  { id: 'f1', labelEn: 'Plot / Khasra No.', labelHi: 'खसरा संख्या', value: '45', value_hi: '45', confidence: 99, status: 'Verified' },
  { id: 'f2', labelEn: 'Register / Khatauni No.', labelHi: 'खतौनी संख्या', value: '89-C', value_hi: '89-C', confidence: 99, status: 'Verified' },
  { id: 'f3', labelEn: 'Landholder Name', labelHi: 'खातेदार का नाम', value: 'Mohan Singh', value_hi: 'मोहन सिंह', confidence: 99, status: 'Verified' },
  { id: 'f4', labelEn: 'Land Area / Extent', labelHi: 'क्षेत्रफल', value: '3.5 Hectares', value_hi: '3.5 हेक्टेयर', confidence: 99, status: 'Verified' },
  { id: 'f5', labelEn: 'Village / Revenue Circle', labelHi: 'मौजा / ग्राम', value: 'Kishanpur', value_hi: 'किशनपुर', confidence: 99, status: 'Verified' },
];

const initialRecords: Record[] = [
  { 
    id: '1', fields: mockFieldsRecord1, date: '2023-10-12',
    khasraNo: '102/2', khasraNo_hi: '102/2', khatauniNo: '14-A', khatauniNo_hi: '14-A', 
    name: 'Sita Ram', name_hi: 'सीता राम', area: '1.2 Acres', area_hi: '1.2 एकड़', village: 'Rampur Mauza', village_hi: 'रामपुर मौजा' 
  },
  { 
    id: '2', fields: mockFieldsRecord2, date: '2023-10-14',
    khasraNo: '45', khasraNo_hi: '45', khatauniNo: '89-C', khatauniNo_hi: '89-C', 
    name: 'Mohan Singh', name_hi: 'मोहन सिंह', area: '3.5 Hectares', area_hi: '3.5 हेक्टेयर', village: 'Kishanpur', village_hi: 'किशनपुर' 
  },
];

const UI_TEXT = {
  en: {
    exportPdf: 'Export PDF',
    uploadDoc: 'Upload Document',
    dbTitle: 'Digitized Land Records Database',
    dbDesc: 'All verified and approved landholder records.',
    backToReview: 'Back to Review',
    wbTitle: 'Land Record Verification Workbench',
    wbDesc: 'Verify AI-extracted fields against the source document.',
    sourceViewer: 'Source Document Viewer',
    livePreview: 'DOC-LIVE-PREVIEW',
    reviewNeeded: 'Review Needed',
    verified: 'Verified',
    allVerified: 'All Fields Verified',
    fieldName: 'Field Name',
    extractedValue: 'Extracted Value',
    confidence: 'Confidence',
    status: 'Status',
    confirm: 'Confirm',
    submitApproval: 'Submit Final Approval',
    clearToSubmit: 'Clear Pending Reviews to Submit',
    thRecordId: 'Record ID',
    thKhasra: 'Plot / Khasra No.',
    thKhatauni: 'Khatauni No.',
    thName: 'Landholder Name',
    thArea: 'Area / Extent',
    thVillage: 'Village',
    thDate: 'Date Verified'
  },
  hi: {
    exportPdf: 'डाउनलोड पीडीएफ',
    uploadDoc: 'दस्तावेज़ अपलोड करें',
    dbTitle: 'डिजिटलीकृत भूमि रिकॉर्ड डेटाबेस',
    dbDesc: 'सभी सत्यापित और स्वीकृत खातेदार रिकॉर्ड।',
    backToReview: 'समीक्षा पर वापस जाएं',
    wbTitle: 'भूमि रिकॉर्ड सत्यापन कार्यक्षेत्र',
    wbDesc: 'स्रोत दस्तावेज़ के विरुद्ध AI-निकाले गए फ़ील्ड को सत्यापित करें।',
    sourceViewer: 'स्रोत दस्तावेज़ व्यूअर',
    livePreview: 'दस्तावेज़ लाइव पूर्वावलोकन',
    reviewNeeded: 'समीक्षा आवश्यक',
    verified: 'सत्यापित',
    allVerified: 'सभी फ़ील्ड सत्यापित',
    fieldName: 'फ़िल्ड का नाम',
    extractedValue: 'निकाला गया मूल्य',
    confidence: 'विश्वसनीयता',
    status: 'स्थिति',
    confirm: 'पुष्टि करें',
    submitApproval: 'अंतिम स्वीकृति जमा करें',
    clearToSubmit: 'जमा करने के लिए लंबित समीक्षा साफ़ करें',
    thRecordId: 'रिकॉर्ड आईडी',
    thKhasra: 'खसरा संख्या',
    thKhatauni: 'खतौनी संख्या',
    thName: 'खातेदार का नाम',
    thArea: 'क्षेत्रफल',
    thVillage: 'गांव / मौजा',
    thDate: 'सत्यापित तिथि'
  }
};

function App() {
  const [fields, setFields] = useState<ExtractedField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showFinalTable, setShowFinalTable] = useState(false);
  const [records, setRecords] = useState<Record[]>(initialRecords);
  
  const [displayLang, setDisplayLang] = useState<DisplayLang>('en');

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const t = UI_TEXT[displayLang];

  const handleRowClick = (field: ExtractedField) => {
    setSelectedFieldId(field.id);
    setEditValue(displayLang === 'hi' ? field.value_hi : field.value);
  };

  const handleRecordRowClick = (record: Record) => {
    setFields(record.fields);
    setShowFinalTable(false);
    // Note: We don't have the original image blob here for mock data, so the viewer might show fallback.
    // In a real app, record would include the URL of the processed document.
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleConfirm = () => {
    if (selectedFieldId) {
      setFields(fields.map(f => {
        if (f.id === selectedFieldId) {
          return {
            ...f,
            ...(displayLang === 'hi' ? { value_hi: editValue } : { value: editValue }),
            confidence: 100,
            status: 'Verified'
          };
        }
        return f;
      }));
      setSelectedFieldId(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const previewUrl = URL.createObjectURL(file);
    setUploadedImagePreview(previewUrl);
    setUploadedFileType(file.type);
    setIsProcessing(true);
    setSelectedFieldId(null);
    setShowFinalTable(false);
  
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.8-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `Extract the following fields from the land record document: 
  khasra_number, khatauni_number, owner_name, area_extent, village_mauza.
  For each field, return an object containing { value: string, value_hi: string, confidence: number (0-100), box_2d: [ymin, xmin, ymax, xmax], page_number: number }.
  The "value" should be the extracted text translated to English.
  The "value_hi" should be the extracted text translated to Hindi (Devanagari).
  The page_number should be the 1-indexed page where the value was found.
  The box_2d coordinates should be based on a 1000x1000 scale.
  Return strict JSON in this exact format:
  {
    "khasra_number": { "value": "", "value_hi": "", "confidence": 0, "box_2d": [0,0,0,0], "page_number": 1 },
    "khatauni_number": { "value": "", "value_hi": "", "confidence": 0, "box_2d": [0,0,0,0], "page_number": 1 },
    "owner_name": { "value": "", "value_hi": "", "confidence": 0, "box_2d": [0,0,0,0], "page_number": 1 },
    "area_extent": { "value": "", "value_hi": "", "confidence": 0, "box_2d": [0,0,0,0], "page_number": 1 },
    "village_mauza": { "value": "", "value_hi": "", "confidence": 0, "box_2d": [0,0,0,0], "page_number": 1 }
  }`;
  
      const imagePart = await fileToGenerativePart(file);
      
      let data: any = null;
      let retries = 3;
      
      while (retries > 0) {
        try {
          const result = await model.generateContent([prompt, imagePart]);
          const response = await result.response;
          const text = response.text();
          const cleanText = text.replace(/```(?:json)?/gi, '').trim();
          data = JSON.parse(cleanText);
          break;
        } catch (err: any) {
          retries--;
          if (retries === 0 || !(err.message && err.message.includes('503'))) {
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
  
      const updatedFields: ExtractedField[] = [
        { id: 'f1', labelEn: 'Plot / Khasra No.', labelHi: 'खसरा संख्या', value: data.khasra_number?.value || 'N/A', value_hi: data.khasra_number?.value_hi || 'N/A', confidence: data.khasra_number?.confidence || 0, status: data.khasra_number?.confidence < 80 ? 'Review Needed' : 'Verified', box2d: data.khasra_number?.box_2d, page_number: data.khasra_number?.page_number },
        { id: 'f2', labelEn: 'Register / Khatauni No.', labelHi: 'खतौनी संख्या', value: data.khatauni_number?.value || 'N/A', value_hi: data.khatauni_number?.value_hi || 'N/A', confidence: data.khatauni_number?.confidence || 0, status: data.khatauni_number?.confidence < 80 ? 'Review Needed' : 'Verified', box2d: data.khatauni_number?.box_2d, page_number: data.khatauni_number?.page_number },
        { id: 'f3', labelEn: 'Landholder Name', labelHi: 'खातेदार का नाम', value: data.owner_name?.value || 'N/A', value_hi: data.owner_name?.value_hi || 'N/A', confidence: data.owner_name?.confidence || 0, status: data.owner_name?.confidence < 80 ? 'Review Needed' : 'Verified', box2d: data.owner_name?.box_2d, page_number: data.owner_name?.page_number },
        { id: 'f4', labelEn: 'Land Area / Extent', labelHi: 'क्षेत्रफल', value: data.area_extent?.value || 'N/A', value_hi: data.area_extent?.value_hi || 'N/A', confidence: data.area_extent?.confidence || 0, status: data.area_extent?.confidence < 80 ? 'Review Needed' : 'Verified', box2d: data.area_extent?.box_2d, page_number: data.area_extent?.page_number },
        { id: 'f5', labelEn: 'Village / Revenue Circle', labelHi: 'मौजा / ग्राम', value: data.village_mauza?.value || 'N/A', value_hi: data.village_mauza?.value_hi || 'N/A', confidence: data.village_mauza?.confidence || 0, status: data.village_mauza?.confidence < 80 ? 'Review Needed' : 'Verified', box2d: data.village_mauza?.box_2d, page_number: data.village_mauza?.page_number },
      ];
      setFields(updatedFields);
    } catch (err: any) {
      console.error("Extraction error:", err);
      alert(`Failed to extract data: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitApproval = () => {
    const newRecord: Record = {
      id: Date.now().toString(),
      fields: fields,
      khasraNo: fields.find(f => f.id === 'f1')?.value || '',
      khasraNo_hi: fields.find(f => f.id === 'f1')?.value_hi || '',
      khatauniNo: fields.find(f => f.id === 'f2')?.value || '',
      khatauniNo_hi: fields.find(f => f.id === 'f2')?.value_hi || '',
      name: fields.find(f => f.id === 'f3')?.value || '',
      name_hi: fields.find(f => f.id === 'f3')?.value_hi || '',
      area: fields.find(f => f.id === 'f4')?.value || '',
      area_hi: fields.find(f => f.id === 'f4')?.value_hi || '',
      village: fields.find(f => f.id === 'f5')?.value || '',
      village_hi: fields.find(f => f.id === 'f5')?.value_hi || '',
      date: new Date().toISOString().split('T')[0]
    };
    setRecords([...records, newRecord]);
    setShowFinalTable(true);
  };

  const renderBox = (box?: [number, number, number, number]) => {
    if (!box) return null;
    const [ymin, xmin, ymax, xmax] = box;
    const top = (ymin / 1000) * 100;
    const left = (xmin / 1000) * 100;
    const height = ((ymax - ymin) / 1000) * 100;
    const width = ((xmax - xmin) / 1000) * 100;
  
    return (
      <div 
        className="absolute border-2 border-red-500 bg-red-500/20 animate-pulse pointer-events-none"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${width}%`,
          height: `${height}%`,
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
        }}
      />
    );
  };

  const pendingCount = fields.filter(f => f.status === 'Review Needed').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* Hide elements on print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full { width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
          body, .min-h-screen, main { background: white !important; }
        }
      `}</style>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center flex-col text-white no-print">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-6" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">AI Extracting Document Fields...</h2>
          <p className="text-slate-300 font-medium bg-slate-800 px-4 py-1.5 rounded-full shadow-inner text-sm">Powered by Gemini</p>
        </div>
      )}

      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20 no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <FileText className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">National Land Record Digitization Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          
          <button 
            onClick={handleExportPDF}
            className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors text-sm px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
          >
            <Printer className="w-4 h-4" />
            {t.exportPdf}
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setDisplayLang('en')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${displayLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              English
            </button>
            <button
              onClick={() => setDisplayLang('hi')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${displayLang === 'hi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              हिंदी
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <UserCircle className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Officer #4029</span>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*,application/pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Upload className="w-4 h-4" />
            {t.uploadDoc}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 gap-6 relative print-full">
        {showFinalTable ? (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500 print-full">
            <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg no-print">
                  <Table className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{t.dbTitle}</h2>
                  <p className="text-sm text-slate-500 font-medium">{t.dbDesc}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFinalTable(false)}
                className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors text-sm no-print"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToReview}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 print-full">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                      <th className="px-6 py-4">{t.thRecordId}</th>
                      <th className="px-6 py-4">{t.thKhasra}</th>
                      <th className="px-6 py-4">{t.thKhatauni}</th>
                      <th className="px-6 py-4">{t.thName}</th>
                      <th className="px-6 py-4">{t.thArea}</th>
                      <th className="px-6 py-4">{t.thVillage}</th>
                      <th className="px-6 py-4">{t.thDate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map(record => (
                      <tr 
                        key={record.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleRecordRowClick(record)}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600">#{record.id.slice(-6)}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{displayLang === 'hi' ? record.khasraNo_hi : record.khasraNo}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{displayLang === 'hi' ? record.khatauniNo_hi : record.khatauniNo}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 font-bold">{displayLang === 'hi' ? record.name_hi : record.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{displayLang === 'hi' ? record.area_hi : record.area}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{displayLang === 'hi' ? record.village_hi : record.village}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel */}
            <div 
              className={`
                transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex shrink-0 no-print
                ${selectedFieldId ? 'w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-8'}
              `}
            >
              <div className="w-full h-full bg-slate-900 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col">
                <div className="h-12 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0">
                  <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{t.sourceViewer}</span>
                  <span className="text-slate-500 text-xs">{t.livePreview}</span>
                </div>

                <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden p-4">
                  {uploadedImagePreview ? (
                    uploadedFileType === 'application/pdf' ? (
                      <iframe 
                        key={selectedField?.page_number || 1}
                        src={`${uploadedImagePreview}#page=${selectedField?.page_number || 1}`} 
                        className="w-full h-full rounded" 
                        title="Document Preview" 
                      />
                    ) : (
                      <div className="relative max-w-full max-h-full flex items-center justify-center">
                        <img src={uploadedImagePreview} alt="Uploaded Document" className="max-w-full max-h-full object-contain bg-white rounded shadow-2xl" />
                        {selectedField?.box2d && renderBox(selectedField.box2d)}
                      </div>
                    )
                  ) : (
                    <div className="relative w-full max-w-md aspect-[1/1.4] bg-[#fdfbf7] shadow-2xl rounded px-8 py-12 flex flex-col gap-6">
                      <div className="border-b-2 border-slate-300 pb-4 mb-4 text-center">
                        <h3 className="font-serif text-xl font-bold text-slate-800">Govt. Land Record</h3>
                        <p className="font-serif text-sm text-slate-600">Department of Revenue</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        
                        <div className="flex justify-between mt-8 border border-slate-300 p-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Land Area / Extent</p>
                            <p className="font-serif font-bold text-slate-800 relative inline-block">
                              2.5 Acres
                              {selectedFieldId === 'f4' && (
                                <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none">
                                  <rect x="0" y="0" width="100%" height="100%" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="2" rx="4" className="animate-pulse" />
                                </svg>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Plot / Khasra</p>
                            <p className="font-serif font-bold text-slate-800">128/4A</p>
                          </div>
                        </div>
                        
                        <div className="h-4 bg-slate-200 rounded w-4/5 mt-8"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex-1 shrink-0 print-full">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center z-10 relative">
                <div>
                  <div className="flex items-center gap-4">
                    {showFinalTable === false && records.length > 0 && (
                      <button 
                        onClick={() => setShowFinalTable(true)}
                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors no-print"
                        title="View Database"
                      >
                        <Table className="w-5 h-5" />
                      </button>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{t.wbTitle}</h2>
                      <p className="text-sm text-slate-500 font-medium">{t.wbDesc}</p>
                    </div>
                  </div>
                </div>
                {pendingCount > 0 ? (
                  <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-amber-200 shadow-sm animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    {pendingCount} {displayLang === 'hi' ? 'फ़ील्ड की समीक्षा आवश्यक है' : `Field${pendingCount > 1 ? 's' : ''} Need${pendingCount === 1 ? 's' : ''} Review`}
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.allVerified}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/30">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-4 font-bold">{t.fieldName}</th>
                      <th className="px-6 py-4 font-bold">{t.extractedValue}</th>
                      <th className="px-6 py-4 font-bold">{t.confidence}</th>
                      <th className="px-6 py-4 font-bold">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map(field => {
                      const isSelected = selectedFieldId === field.id;
                      const isReviewNeeded = field.status === 'Review Needed';
                      
                      return (
                        <tr 
                          key={field.id}
                          onClick={() => handleRowClick(field)}
                          className={`
                            cursor-pointer transition-all duration-300 group
                            ${isSelected 
                              ? (isReviewNeeded ? 'bg-red-50/80' : 'bg-indigo-50/80') 
                              : 'bg-white hover:bg-slate-50'
                            }
                          `}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-10 rounded-full ${isReviewNeeded ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{displayLang === 'hi' ? field.labelHi : field.labelEn}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">{displayLang === 'hi' ? field.labelEn : field.labelHi}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5">
                            {isSelected ? (
                              <div className="flex items-center gap-3 no-print">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className={`
                                    px-4 py-2 border-2 rounded-lg text-sm font-bold w-48 outline-none
                                    focus:ring-4 transition-all shadow-sm
                                    ${isReviewNeeded 
                                      ? 'border-red-400 bg-white text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                                      : 'border-indigo-400 bg-white text-indigo-900 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }
                                  `}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.stopPropagation();
                                      handleConfirm();
                                    }
                                  }}
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
                                >
                                  <Check className="w-4 h-4" />
                                  {t.confirm}
                                </button>
                              </div>
                            ) : (
                              <span className={`font-bold text-sm ${isReviewNeeded ? 'text-red-600' : 'text-slate-700'}`}>
                                {displayLang === 'hi' ? field.value_hi : field.value}
                              </span>
                            )}
                            
                            {/* Value fallback for printing when in edit mode */}
                            <span className="hidden print:block font-bold text-sm text-slate-700">
                                {displayLang === 'hi' ? field.value_hi : field.value}
                            </span>
                          </td>
                          
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-xs font-bold ${isReviewNeeded ? 'text-red-600' : 'text-slate-600'}`}>
                                {field.confidence}%
                              </span>
                              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isReviewNeeded ? 'bg-red-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${field.confidence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-5">
                            {isReviewNeeded ? (
                              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200">
                                <AlertTriangle className="w-4 h-4" />
                                {t.reviewNeeded}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4" />
                                {t.verified}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
                 <button 
                    onClick={handleSubmitApproval}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${pendingCount === 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    disabled={pendingCount > 0}
                 >
                    {pendingCount === 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {t.submitApproval}
                      </>
                    ) : (
                      t.clearToSubmit
                    )}
                 </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
