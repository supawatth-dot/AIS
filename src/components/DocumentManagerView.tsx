import React, { useState } from 'react';
import { 
  FileText, Upload, Trash2, Calendar, FileType, CheckCircle, Info, 
  Sparkles, ExternalLink, RefreshCw, Layers 
} from 'lucide-react';
import { SystemDocument } from '../types';

interface DocumentManagerViewProps {
  documents: SystemDocument[];
  onUploadDocument: (data: {
    name: string;
    base64: string;
    fileType: SystemDocument['fileType'];
    linkedType: SystemDocument['linkedType'];
    linkedId: string | null;
  }) => Promise<any>;
  onDeleteDocument: (id: string) => Promise<any>;
  onRefresh: () => void;
}

export default function DocumentManagerView({
  documents,
  onUploadDocument,
  onDeleteDocument,
  onRefresh
}: DocumentManagerViewProps) {
  
  const [filterType, setFilterType] = useState<string>('All');
  const [dragActive, setDragActive] = useState(false);
  const [uploadFileType, setUploadFileType] = useState<SystemDocument['fileType']>('Contract');
  const [linkedType, setLinkedType] = useState<SystemDocument['linkedType']>('general');
  const [linkedId, setLinkedId] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) return;

    setIsUploading(true);
    setSuccessMessage('');
    try {
      await onUploadDocument({
        name: selectedFile.name,
        base64: fileBase64,
        fileType: uploadFileType,
        linkedType: linkedType,
        linkedId: linkedId ? linkedId.trim() : null
      });

      setSuccessMessage(`อัปโหลดไฟล์ "${selectedFile.name}" สำเร็จและลงคลังเรียบร้อย!`);
      setSelectedFile(null);
      setFileBase64('');
      setLinkedId('');
      onRefresh();
    } catch (e: any) {
      alert('เซฟไฟล์ล้มเหลว: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการทิ้งเอกสารสำคัญชิ้นนี้จากหน่วยประมวลผลใช่หรือไม่?')) {
      try {
        await onDeleteDocument(id);
        onRefresh();
      } catch (e: any) {
        alert(e.message || 'ลบล้มเหลว');
      }
    }
  };

  // Convert bytes to readable output
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter doc lists
  const filteredDocs = filterType === 'All' 
    ? documents 
    : documents.filter(d => d.fileType === filterType);

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Drag & Drop Upload Zone */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-md font-bold text-gray-800">ส่งอัปโหลดเอกสาร / ดันประวัติ</h3>
            <p className="text-xs text-gray-450 mt-1">
              แนบเอกสารสัญญา AIS เช็กซื้อขาย หรือ Handover Forms เพื่อประกอบทะเบียนทรัพย์สินคงคลัง
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            
            {/* Drag and Drop Box */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors relative cursor-pointer ${
                dragActive ? 'border-brand-primary bg-lime-50/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <Upload size={32} className="text-gray-400 mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-emerald-700 truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="text-[11px] text-gray-500">
                  <p className="font-semibold">ลากและวางไฟล์ PDF / รูปภาพ เพื่ออัปโหลด</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</p>
                </div>
              )}
              
              <input 
                type="file" 
                onChange={handleFileSelect} 
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-medium flex items-center gap-1.5 animate-bounce">
                <CheckCircle size={15} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Document metadata fields */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">หมวดหมู่เอกสาร</label>
                <select
                  value={uploadFileType}
                  onChange={(e) => setUploadFileType(e.target.value as any)}
                  className="w-full p-2 bg-white border border-gray-250 rounded"
                >
                  <option value="Contract">ใบแต่งสัญญาเบอร์ยื่นจด (Contract)</option>
                  <option value="Invoice">ใบสั่งซื้อ/ใบรับของเคลม (Invoice)</option>
                  <option value="Device Photo">ภาพถ่ายผลิตภัณฑ์เด่น (Device Photo)</option>
                  <option value="Handover Form">ฟอร์มเซ็นชื่อตรวจรับพนักงาน (Handover Form)</option>
                  <option value="Warranty File">ใบหมดประกัน / ประวัติคุ้มครอง (Warranty File)</option>
                  <option value="Other">ใบเซ็นชื่อเอกสารทั่วไป (Other)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">ผูกเข้าส่วนสารบรรณ</label>
                <select
                  value={linkedType}
                  onChange={(e) => setLinkedType(e.target.value as any)}
                  className="w-full p-2 bg-white border border-gray-250 rounded"
                >
                  <option value="general">เอกสารกองกลางทั่วไป</option>
                  <option value="asset">ผูกรหัสเครื่องโทรศัพท์มือถือ</option>
                  <option value="contract">ผูกเข้าสารบรรณซิม (เบอร์มือถือ)</option>
                </select>
              </div>

              {linkedType !== 'general' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">รหัสพ่วง (ID / เบอร์)</label>
                  <input
                    type="text"
                    required
                    value={linkedId}
                    onChange={(e) => setLinkedId(e.target.value)}
                    placeholder={linkedType === 'asset' ? 'e.g. AST-0001' : 'e.g. 0812345678'}
                    className="w-full p-2 border border-gray-250 rounded font-mono text-xs"
                  />
                </div>
              )}

            </div>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  <span>กำลังอัปโหลดส่งสัญญาณคลัง...</span>
                </>
              ) : (
                <>
                  <Upload size={13} />
                  <span>ส่งอัปโหลดบันทึกไฟล์เด่น</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Files Management Deck */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-bold text-gray-800">คลังเอกสารแนบอิเล็กทรอนิกส์ทั้งหมด</h3>
              <p className="text-xs text-gray-400 mt-1">เข้าดูภาพถ่าย หรือใบเสัญญา AIS ได้โดยตรงจากเซิร์ฟเวอร์สำรอง</p>
            </div>
            
            {/* Direct Category Filters Icons */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border p-1 rounded-lg bg-gray-50 focus:border-brand-primary"
            >
              <option value="All">ทุกเอกสารทั้งหมด ({documents.length})</option>
              <option value="Contract">สัญญาจดทะเบียนเบอร์</option>
              <option value="Invoice">ใบกำกับสั่งซื้อ</option>
              <option value="Device Photo">ภาพถ่ายเครื่องผลิตภัณฑ์</option>
              <option value="Handover Form">ประวัติรับเครื่องทีมงาน</option>
              <option value="Warranty File">เอกสารเคลมศูนย์รับประกัน</option>
              <option value="Other">ใบแนบข้อมูลอื่นๆ</option>
            </select>
          </div>

          {/* Files grid list */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg text-gray-400 text-xs">
                ไม่มีข้อมูลเอกสารประกอบในแฟ้มคลังส่วนตัวของคุณ
              </div>
            ) : (
              filteredDocs.map((doc) => {
                // Link direct download from express server!
                // doc.filePath yields '/uploads/timestampedName.pdf' which Express static server serves perfectly!
                const fileDownloadUrl = doc.filePath;

                return (
                  <div key={doc.id} className="p-3.5 bg-white border border-gray-150 rounded-xl flex items-center justify-between gap-3 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 bg-gray-100 text-slate-550 rounded-lg shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate max-w-[280px]">{doc.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-gray-400 mt-0.5">
                          <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-sm text-[9px] uppercase">
                            {doc.fileType}
                          </span>
                          <span>ขนาด: {formatBytes(doc.fileSize)}</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar size={10} />
                            <span>{doc.uploadedAt.split('T')[0]}</span>
                          </span>
                        </div>
                        
                        {doc.linkedId && (
                          <div className="mt-1 text-[10px] text-slate-600 flex items-center gap-1 font-mono">
                            <Layers size={11} className="text-emerald-600" />
                            <span>ผูกโยง: นิติกรรม ({doc.linkedId}) / ({doc.linkedType === 'asset' ? 'เครื่องเด่น' : 'ซิมฮาร์ด'})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* View actual file served by server */}
                      <a 
                        href={fileDownloadUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 px-2.5 text-slate-700 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        <span>เปิดไฟล์</span>
                      </a>
                      
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
