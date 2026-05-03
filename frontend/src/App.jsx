import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Classes from './pages/classes/Classes'
import ClasseDetail from './pages/classes/ClasseDetail'
import ClasseAffectations from './pages/classes/ClasseAffectations'
import ClasseEtudiants from './pages/classes/ClasseEtudiants'
import ClasseSeances from './pages/classes/ClasseSeances'
import ClassePresences from './pages/classes/ClassePresences'
import ClasseJustifications from './pages/classes/ClasseJustifications'
import ClasseDocuments from './pages/classes/ClasseDocuments'
import ClasseRapport from './pages/classes/ClasseRapport'
import Periodes from './pages/parametrage/Periodes'
import Matieres from './pages/parametrage/Matieres'
import Enseignants from './pages/parametrage/Enseignants'
import Etudiants from './pages/saisie/Etudiants'
import RapportAbsences from './pages/rapports/RapportAbsences'
import RapportMatieres from './pages/rapports/RapportMatieres'
import RapportEtudiant from './pages/rapports/RapportEtudiant'

const PrivateRoute = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!localStorage.getItem('token')) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:filiereId" element={<ClasseDetail />} />
          <Route path="classes/:filiereId/affectations" element={<ClasseAffectations />} />
          <Route path="classes/:filiereId/etudiants" element={<ClasseEtudiants />} />
          <Route path="classes/:filiereId/seances" element={<ClasseSeances />} />
          <Route path="classes/:filiereId/presences" element={<ClassePresences />} />
          <Route path="classes/:filiereId/justifications" element={<ClasseJustifications />} />
          <Route path="classes/:filiereId/documents" element={<ClasseDocuments />} />
          <Route path="classes/:filiereId/rapport" element={<ClasseRapport />} />
          <Route path="parametrage/periodes" element={<AdminRoute><Periodes /></AdminRoute>} />
          <Route path="parametrage/matieres" element={<AdminRoute><Matieres /></AdminRoute>} />
          <Route path="parametrage/enseignants" element={<AdminRoute><Enseignants /></AdminRoute>} />
          <Route path="saisie/etudiants" element={<AdminRoute><Etudiants /></AdminRoute>} />
          <Route path="rapports/absences" element={<AdminRoute><RapportAbsences /></AdminRoute>} />
          <Route path="rapports/matieres" element={<AdminRoute><RapportMatieres /></AdminRoute>} />
          <Route path="rapports/etudiant" element={<AdminRoute><RapportEtudiant /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
