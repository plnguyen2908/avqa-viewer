import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AVQAViewer from "./AVQAViewer";
import GuidancePage from "./GuidancePage";

export default function App() {
  return (
    <BrowserRouter basename="/avqa-viewer">
      <Routes>
        <Route path="/" element={<AVQAViewer />} />
        <Route path="/guidance" element={<GuidancePage />} />

      </Routes>
    </BrowserRouter>
  );
}
