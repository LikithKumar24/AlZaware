// src/pages/assessment/mri-upload.tsx
import { useState, ChangeEvent, DragEvent, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, BrainCircuit } from "lucide-react";

export default function MriUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setPrediction(null);
      setConfidence(null);
      setError(null);
      setConfirmation(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setPrediction(null);
      setConfidence(null);
      setError(null);
      setConfirmation(null);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setPrediction(null);
    setConfidence(null);
    setError(null);
    setConfirmation(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const predictResponse = await axios.post('http://127.0.0.1:8000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { prediction, confidence } = predictResponse.data;
      setPrediction(prediction);
      setConfidence(confidence);

      if (!token) {
        setError("You must be logged in to save an assessment.");
        return;
      }

      await axios.post('http://127.0.0.1:8000/assessments/', {
        prediction,
        confidence,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConfirmation('Assessment saved successfully!');
    } catch (err) {
      setError('An error occurred during analysis or saving the assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-50">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">Analyze MRI Scan</CardTitle>
          <CardDescription className="text-slate-600">
            Upload your brain MRI scan to get a prediction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <UploadCloud className="w-12 h-12 text-gray-400" />
              <p className="text-gray-500">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>

          {preview && (
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Image Preview</h3>
              <img src={preview} alt="Image preview" className="max-w-full h-auto mx-auto rounded-lg shadow-md" />
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg text-center">
                <p className="text-red-600">{error}</p>
            </div>
          )}

          {confirmation && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-green-600">{confirmation}</p>
              <Link href="/results-history" passHref>
                <Button className="mt-4">View Results History</Button>
              </Link>
            </div>
          )}

          {prediction && confidence !== null && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Prediction Result</h3>
              <div className="flex items-center justify-center space-x-2">
                <BrainCircuit className="w-6 h-6 text-blue-600" />
                <p className="text-xl font-bold text-blue-700">{prediction}</p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Confidence: <span className="font-semibold">{(confidence * 100).toFixed(2)}%</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Submit for Analysis'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
