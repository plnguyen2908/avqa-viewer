import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AVQAViewer from "./AVQAViewer";
import EditPage from "./EditPage";

export default function App() {
  return (
    <BrowserRouter basename="/avqa-viewer">
      <Routes>
        <Route path="/" element={<AVQAViewer />} />
        <Route path="/edit/:id" element={<EditPage />} />
      </Routes>
    </BrowserRouter>
  );
}
