import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStudentProfile } from "../api/api";

export default function StudentProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getStudentProfile(id);
        setProfile(data.profile);
      } catch (err) {
        alert("Error loading profile: " + err.message);
      }
    }
    fetchProfile();
  }, [id]);

  if (!profile) return <p className="p-6">Loading profile...</p>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Student Profile</h2>
      <p><strong>ID:</strong> {id}</p>
      <p><strong>Average Score:</strong> {profile.average_score}</p>

      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Frequent Mistakes:</h3>
        <ul className="list-disc ml-6">
          {profile.top_mistakes?.length ? (
            profile.top_mistakes.map((m, i) => <li key={i}>{m}</li>)
          ) : (
            <li>No mistakes logged yet!</li>
          )}
        </ul>
      </div>
    </div>
  );
}
