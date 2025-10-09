import React, { useState } from 'react';
import { Card, Modal, Button, Table, Badge } from 'react-bootstrap';
import { FaEye, FaFileAlt, FaCalendar, FaUser } from 'react-icons/fa';
import './JotformSubmissionView.css';

/**
 * JotformSubmissionView Component
 * 
 * Displays Jotform submission data in the admin reservation view
 * 
 * Props:
 * - submission: The Jotform submission data (parsed JSON)
 * - compact: Whether to show a compact view (default: true)
 */
const JotformSubmissionView = ({ submission, compact = true }) => {
  const [showModal, setShowModal] = useState(false);

  if (!submission) {
    return (
      <div className="alert alert-info">
        <FaFileAlt className="me-2" />
        No additional form submission available for this reservation.
      </div>
    );
  }

  // Extract readable answers
  const getReadableAnswers = () => {
    if (!submission.answers) return {};
    
    const readable = {};
    Object.keys(submission.answers).forEach(key => {
      const answer = submission.answers[key];
      if (answer && typeof answer === 'object') {
        const questionText = answer.text || answer.name || `Question ${key}`;
        const answerValue = answer.answer || answer.prettyFormat || '';
        if (answerValue) {
          readable[questionText] = answerValue;
        }
      }
    });
    
    return readable;
  };

  const readableAnswers = getReadableAnswers();
  const answerCount = Object.keys(readableAnswers).length;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Compact view (for reservation list)
  if (compact) {
    return (
      <>
        <div className="jotform-submission-compact">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <FaFileAlt className="text-primary me-2" />
              <span className="text-muted small">
                Form completed with {answerCount} {answerCount === 1 ? 'response' : 'responses'}
              </span>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <FaEye className="me-1" />
              View Details
            </Button>
          </div>
        </div>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <FaFileAlt className="me-2 text-primary" />
              Form Submission Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <JotformSubmissionView submission={submission} compact={false} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  // Full view (for modal or detail page)
  return (
    <div className="jotform-submission-full">
      {/* Submission metadata */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <FaFileAlt className="text-primary me-2" />
                <strong>Submission ID:</strong>
                <Badge bg="primary" className="ms-2">
                  {submission.submissionID || 'N/A'}
                </Badge>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <FaCalendar className="text-success me-2" />
                <strong>Submitted:</strong>
                <span className="ms-2 text-muted">
                  {formatDate(submission.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          {submission.ip && (
            <div className="mt-2">
              <small className="text-muted">
                <FaUser className="me-1" />
                IP Address: {submission.ip}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Submission answers */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Form Responses</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table striped hover className="mb-0">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(readableAnswers).map(([question, answer], index) => (
                <tr key={index}>
                  <td className="fw-semibold" style={{ width: '40%' }}>
                    {question}
                  </td>
                  <td>
                    {Array.isArray(answer) ? (
                      <ul className="mb-0">
                        {answer.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      answer
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Raw data (collapsible) */}
      <details className="mt-3">
        <summary className="text-muted cursor-pointer">
          <small>View raw submission data</small>
        </summary>
        <pre className="bg-light p-3 mt-2 rounded" style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(submission, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default JotformSubmissionView;
