import { type KEDB, type SearchRequest, type InsertSearchRequest } from "./schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  searchKEDBs(query: string): Promise<KEDB[]>;
  getKEDBById(id: string): Promise<KEDB | undefined>;
  updateKEDB(id: string, updates: Partial<KEDB>): Promise<KEDB | undefined>;
  generateKEDB(incidentDescription: string): Promise<KEDB>;
  createSearchRequest(request: InsertSearchRequest): Promise<SearchRequest>;
}

export class MemStorage implements IStorage {
  private kedbs: Map<string, KEDB>;
  private searchRequests: Map<string, SearchRequest>;

  constructor() {
    this.kedbs = new Map();
    this.searchRequests = new Map();
    this.initializeMockKEDBs();
  }

  private initializeMockKEDBs() {
    const mockKEDBs: KEDB[] = [
      {
        id: 'KB0098765',
        title: 'Performance Monitoring Alert Resolution - Standard Procedure',
        description: 'This KEDB provides standard steps for resolving application performance monitoring alerts detected by AppDynamics or similar monitoring tools.',
        content: `**Performance Monitoring Alert Resolution - Standard Procedure**

**Overview:**
This KEDB provides standard steps for resolving application performance monitoring alerts detected by AppDynamics or similar monitoring tools.

**Prerequisites:**
- Access to monitoring dashboard
- Application server access
- Basic understanding of application architecture

**Resolution Steps:**

**Step 1: Alert Analysis**
1. Log into the monitoring dashboard
2. Navigate to the specific alert details
3. Review the following metrics:
   - Response time degradation
   - Error rate increase
   - Throughput changes
   - Resource utilization

**Step 2: Initial Investigation**
1. Check application server status
2. Verify database connectivity
3. Review recent deployments or configuration changes
4. Examine system resource usage (CPU, Memory, Disk I/O)

**Step 3: Performance Analysis**
1. Identify the root cause using APM tools
2. Check for:
   - Slow database queries
   - Memory leaks
   - Network latency issues
   - External service dependencies

**Step 4: Resolution Actions**
1. If database related:
   - Optimize slow queries
   - Check database connection pool settings
   - Verify database server performance

2. If application related:
   - Restart application services if necessary
   - Check application logs for errors
   - Review recent code changes

3. If infrastructure related:
   - Scale resources if needed
   - Check network connectivity
   - Verify load balancer configuration

**Step 5: Verification**
1. Monitor metrics for improvement
2. Confirm alert resolution
3. Document findings and actions taken
4. Update monitoring thresholds if necessary

**Post-Resolution Tasks:**
- Update incident documentation
- Share findings with development team
- Schedule follow-up review if recurring issue

**Escalation Criteria:**
- If issue persists after following all steps
- If business-critical systems are affected
- If root cause cannot be determined within SLA timeframe`,
        matchPercentage: 78.9,
        rank: 3.3,
        recommended: true,
        createdAt: new Date('2024-08-16T10:00:00Z'),
        updatedAt: new Date('2024-08-18T07:31:04Z'),
      },
      {
        id: 'KB0100628',
        title: 'Generic [CI_wf_appid] CCM AppDynamics has detected a problem with Node [XXXX_CCM_weblogic]',
        description: 'Weblogic Application Startup and Node Recovery procedures for AppDynamics detected issues.',
        content: `**Weblogic Application Startup and Node Recovery**

**Issue:** Starting weblogic App - Node detection problem

**Step 1: Server Access**
- Login into server environment
- Verify server connectivity and permissions
- Check server resource availability

**Step 2: Weblogic Service Status**
- Check weblogic service status
- Review weblogic logs for errors
- Verify port availability and configurations

**Step 3: Node Recovery Process**
- Stop affected weblogic nodes
- Clear temporary files and cache
- Restart nodes in proper sequence
- Monitor node startup process

**Step 4: AppDynamics Integration**
- Verify AppDynamics agent connectivity
- Check application registration in AppDynamics
- Confirm monitoring data flow

**Step 5: Validation**
- Test application functionality
- Verify performance metrics
- Confirm alert resolution in AppDynamics`,
        matchPercentage: 84.8,
        rank: 3.1,
        recommended: false,
        createdAt: new Date('2024-08-17T10:00:00Z'),
        updatedAt: new Date('2024-08-17T14:39:08Z'),
      },
      {
        id: 'KB0083836',
        title: 'TCCO: APPD_BASEMONT_2.1 CCM AppDynamics has detected xxx - Generic',
        description: 'Alert resolution instructions for TCCO AppDynamics BaseMonth 2.1 CCM detected performance degradation.',
        content: `**TCCO: APPD_BASEMONT_2.1 CCM AppDynamics Alert Resolution**

**Root Cause:** AppDynamics has detected a performance degradation in the BaseMonth 2.1 CCM application.

**Alert Enabled Step Instructions**

**Step 1: Initial Assessment**
- Review alert details in AppDynamics dashboard
- Check affected application components
- Identify performance degradation patterns

**Step 2: System Analysis**
- Analyze server resource utilization
- Check database connection status
- Review application logs for errors

**Step 3: CCM Specific Checks**
- Verify CCM service status
- Check BaseMonth 2.1 configuration
- Review CCM database connections

**Step 4: Performance Optimization**
- Restart affected services if needed
- Clear application cache
- Optimize database queries if required

**Step 5: Monitoring and Validation**
- Monitor performance metrics recovery
- Validate alert resolution
- Document findings and actions taken`,
        matchPercentage: 94.3,
        rank: 3.8,
        recommended: false,
        createdAt: new Date('2024-08-15T10:00:00Z'),
        updatedAt: new Date('2024-08-15T23:34:24Z'),
      }
    ];

    mockKEDBs.forEach(kedb => {
      this.kedbs.set(kedb.id, kedb);
    });
  }

  async searchKEDBs(query: string): Promise<KEDB[]> {
    const results = Array.from(this.kedbs.values());
    
    const filteredResults = results.filter(kedb => 
      kedb.title.toLowerCase().includes(query.toLowerCase()) ||
      kedb.description.toLowerCase().includes(query.toLowerCase()) ||
      kedb.content.toLowerCase().includes(query.toLowerCase())
    );

    return filteredResults.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return (b.matchPercentage || 0) - (a.matchPercentage || 0);
    });
  }

  async getKEDBById(id: string): Promise<KEDB | undefined> {
    return this.kedbs.get(id);
  }

  async updateKEDB(id: string, updates: Partial<KEDB>): Promise<KEDB | undefined> {
    const kedb = this.kedbs.get(id);
    if (!kedb) return undefined;

    const updatedKEDB = {
      ...kedb,
      ...updates,
      updatedAt: new Date(),
    };
    this.kedbs.set(id, updatedKEDB);
    return updatedKEDB;
  }

  async generateKEDB(incidentDescription: string): Promise<KEDB> {
    const id = `KB_GENERATED_${Date.now()}`;
    const title = `AI Generated KEDB - ${incidentDescription.substring(0, 50)}${incidentDescription.length > 50 ? '...' : ''}`;
    
    const content = `**AI Generated KEDB Document**

**Incident Description:** ${incidentDescription}

**Automated Analysis:**
Based on the provided incident description, this KEDB has been automatically generated using machine learning algorithms.

**Recommended Resolution Steps:**

**Step 1: Initial Assessment**
1. Review the incident details and symptoms
2. Gather relevant system information
3. Check for similar past incidents

**Step 2: Investigation**
1. Analyze system logs and metrics
2. Identify potential root causes
3. Verify system dependencies

**Step 3: Resolution**
1. Apply recommended fixes based on pattern analysis
2. Monitor system stability
3. Validate resolution effectiveness

**Step 4: Documentation**
1. Record resolution steps taken
2. Update knowledge base
3. Set up monitoring if needed

**AI Confidence Score:** 85.4%
**Generated on:** ${new Date().toLocaleString()}

*Note: This is an AI-generated KEDB. Please review and validate before implementation.*`;

    const newKEDB: KEDB = {
      id,
      title,
      description: `AI-generated KEDB based on incident: ${incidentDescription.substring(0, 100)}${incidentDescription.length > 100 ? '...' : ''}`,
      content,
      matchPercentage: 85.4,
      rank: 1.0,
      recommended: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.kedbs.set(id, newKEDB);
    return newKEDB;
  }

  async createSearchRequest(request: InsertSearchRequest): Promise<SearchRequest> {
    const id = randomUUID();
    const searchRequest: SearchRequest = {
      ...request,
      id,
      createdAt: new Date(),
    };
    this.searchRequests.set(id, searchRequest);
    return searchRequest;
  }
}

export const storage = new MemStorage();