import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

export class DashboardController {
  /**
   * Get dashboard statistics
   * @param req Request
   * @param res Response
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      // Return mock dashboard stats
      res.status(200).json({
        totalClients: 24,
        totalCases: 42,
        totalDocuments: 156,
        totalHearings: 18,
        totalInvoices: 36,
        recentCases: [
          {
            id: '1',
            title: 'Smith vs. Johnson',
            caseNumber: 'CIV-2023-001',
            court: 'Supreme Court',
            nextHearingDate: '2025-06-15',
            status: 'active',
          },
          {
            id: '2',
            title: 'Patel Property Dispute',
            caseNumber: 'CIV-2023-002',
            court: 'High Court',
            nextHearingDate: '2025-06-20',
            status: 'pending',
          },
          {
            id: '3',
            title: 'Kumar Inheritance Case',
            caseNumber: 'CIV-2023-003',
            court: 'District Court',
            nextHearingDate: '2025-06-25',
            status: 'active',
          },
        ],
        upcomingHearings: [
          {
            id: '1',
            caseId: '1',
            caseTitle: 'Smith vs. Johnson',
            court: 'Supreme Court',
            date: '2025-06-15',
            time: '10:00 AM',
            purpose: 'Final Hearing',
          },
          {
            id: '2',
            caseId: '2',
            caseTitle: 'Patel Property Dispute',
            court: 'High Court',
            date: '2025-06-20',
            time: '11:30 AM',
            purpose: 'Evidence Submission',
          },
        ],
        casesByType: [
          { type: 'Civil', count: 15 },
          { type: 'Criminal', count: 8 },
          { type: 'Family', count: 12 },
          { type: 'Property', count: 7 },
        ],
        casesByStatus: [
          { status: 'Active', count: 22 },
          { status: 'Pending', count: 12 },
          { status: 'Closed', count: 8 },
        ],
        revenueByMonth: [
          { month: 'Jan', amount: 45000 },
          { month: 'Feb', amount: 52000 },
          { month: 'Mar', amount: 48000 },
          { month: 'Apr', amount: 61000 },
          { month: 'May', amount: 55000 },
          { month: 'Jun', amount: 67000 },
        ],
      });
    } catch (error) {
      logger.error('Error in getDashboardStats controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new DashboardController();