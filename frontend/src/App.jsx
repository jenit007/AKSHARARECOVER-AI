import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ManuscriptProvider } from './context/ManuscriptContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Four Main Informational Pages
import Home from './pages/Home';
import About from './pages/About';
import AITechnology from './pages/AITechnology';
import WhyItMatters from './pages/WhyItMatters';

// Authentication Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User-Scoped & Functional Application Routes
import ManuscriptLab from './pages/ManuscriptLab';
import ProcessingJourney from './pages/ProcessingJourney';
import MyManuscripts from './pages/MyManuscripts';
import Profile from './pages/Profile';
import CulturalArchive from './pages/CulturalArchive';
import ContributeHeritage from './pages/ContributeHeritage';
import KnowledgeGraph from './pages/KnowledgeGraph';
import HeritageRecord from './pages/HeritageRecord';
import ResearcherReview from './pages/ResearcherReview';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ManuscriptProvider>
            <Router>
              <div className="flex flex-col min-h-screen bg-[#101614] text-[#f1f2e9]">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Four Main Informational Pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/ai-model" element={<AITechnology />} />
                    <Route path="/importance" element={<WhyItMatters />} />

                    {/* Backward-compatibility aliases */}
                    <Route
                      path="/ai-technology"
                      element={<Navigate to="/ai-model" replace />}
                    />
                    <Route
                      path="/why-it-matters"
                      element={<Navigate to="/importance" replace />}
                    />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected User Workflow Routes */}
                    <Route
                      path="/analyse"
                      element={
                        <ProtectedRoute>
                          <ManuscriptLab />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/lab"
                      element={
                        <ProtectedRoute>
                          <ManuscriptLab />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/processing"
                      element={
                        <ProtectedRoute>
                          <ProcessingJourney />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/:id"
                      element={
                        <ProtectedRoute>
                          <ProcessingJourney />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-manuscripts"
                      element={
                        <ProtectedRoute>
                          <MyManuscripts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/library"
                      element={<Navigate to="/my-manuscripts" replace />}
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archive"
                      element={
                        <ProtectedRoute>
                          <CulturalArchive />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/contribute"
                      element={
                        <ProtectedRoute>
                          <ContributeHeritage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/knowledge-graph"
                      element={
                        <ProtectedRoute>
                          <KnowledgeGraph />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/review"
                      element={
                        <ProtectedRoute>
                          <ResearcherReview />
                        </ProtectedRoute>
                      }
                    />

                    {/* Digital Heritage Record / QR Passport Route (supports owner or public ?token=) */}
                    <Route
                      path="/heritage-record/:id"
                      element={<HeritageRecord />}
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ManuscriptProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
