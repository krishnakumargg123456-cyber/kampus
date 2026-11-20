import heroStudentsImg from '../assets/images/notes_exchange_hero_1794550950819.jpg';
import algoCoverImg from '../assets/images/notes_cover_algorithms_1794550951133.jpg';
import scienceCoverImg from '../assets/images/notes_cover_science_1794550951402.jpg';
import csAlgoImg from '../assets/images/studyhub_cs_algorithms_1794549223031.jpg';
import stemImg from '../assets/images/studyhub_science_stem_1794549223458.jpg';
import examPrepImg from '../assets/images/studyhub_exam_prep_1794549223106.jpg';
import priyaAvatarImg from '../assets/images/avatar_priya_1794407582447.jpg';
import adityaAvatarImg from '../assets/images/peer_aditya_avatar_1794550951152.jpg';
import rohanAvatarImg from '../assets/images/peer_rohan_avatar_1794550952719.jpg';

import {
  NoteRequestItem,
  NotesExchangeState,
  SharedNoteItem,
} from '../types/notesExchange';

export const NOTES_EXCHANGE_IMAGES = {
  heroBanner: heroStudentsImg,
  algoCover: algoCoverImg,
  scienceCover: scienceCoverImg,
  csAlgo: csAlgoImg,
  stem: stemImg,
  examPrep: examPrepImg,
  priyaAvatar: priyaAvatarImg,
  adityaAvatar: adityaAvatarImg,
  rohanAvatar: rohanAvatarImg,
};

export const INITIAL_SHARED_NOTES: SharedNoteItem[] = [
  {
    id: 'sn-1',
    title: 'Handwritten Graph Theory, Treewidth & DP on Trees Complete Derivations',
    course: 'CS-302 (Algorithms)',
    subjectArea: 'Computer Science',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'Handwritten PDF',
    summary:
      'Complete lecture-by-lecture derivations covering DFS tree classification, Tarjan bridges & articulation points, Lowest Common Ancestor via binary lifting, and rerooting DP on trees.',
    content: `# Graph Theory & Dynamic Programming on Trees (CS-302)

## 1. DFS Tree Edges & Bridges (Tarjan's Algorithm)
For any undirected connected graph $G = (V, E)$, a DFS traversal classifies every edge into **Tree Edges** and **Back Edges** (never cross edges).

- Track \`tin[u]\`: discovery time of vertex $u$.
- Track \`low[u]\`: minimum \`tin\` reachable from the subtree of $u$ using at most one back edge.
- Recurrence:
  - For tree edge $(u, v)$: \`low[u] = min(low[u], low[v])\`. Bridge iff \`low[v] > tin[u]\`.
  - For back edge $(u, v)$: \`low[u] = min(low[u], tin[v])\`.

## 2. Dynamic Programming on Trees (Subtree & Rerooting)
### Standard Subtree DP
Compute \`dp[u]\` using only children $v \\in \\text{children}(u)$:
- Independent Set on Tree:
  - \`dp[u][0] = sum(max(dp[v][0], dp[v][1]))\`
  - \`dp[u][1] = weight[u] + sum(dp[v][0])\`

### Rerooting Technique ($O(N)$ total)
1. First DFS computes \`sub[u]\` and \`down[u]\` rooted at node \`1\`.
2. Second DFS pushes parent contribution \`up[u]\` down to each child $v$ by subtracting $v$'s contribution from $u$'s total (using prefix/suffix sums if operations lack inverses).

## 3. Exam Checklist
- Always verify base case for leaf nodes.
- Remember 0-indexed vs 1-indexed array sizes when building \`up[u][k]\` binary lifting table ($K = \\lceil \\log_2 N \\rceil + 1$).`,
    tags: ['Graph Theory', 'Tarjan', 'Tree DP', 'Mid-Sem Prep'],
    pagesCount: 24,
    authorName: 'Priya Sharma',
    authorCollege: 'IIT Bombay',
    authorAvatar: priyaAvatarImg,
    isOwnUpload: true,
    isVerified: true,
    createdAt: '2026-03-21T16:40:00Z',
    dateLabel: 'Yesterday',
    rating: 4.9,
    reviews: [
      {
        id: 'rev-101',
        authorName: 'Ananya Verma',
        authorCollege: 'IIT Bombay',
        rating: 5,
        comment:
          'The rerooting DP prefix/suffix trick saved me on Assignment 3. Diagrams are super clean.',
        createdAt: '2026-03-22T08:15:00Z',
        helpfulCount: 14,
      },
      {
        id: 'rev-102',
        authorName: 'Siddharth Rao',
        authorCollege: 'NIT Surathkal',
        rating: 5,
        comment:
          'Best concise proof for Tarjan low-link condition I have seen so far.',
        createdAt: '2026-03-22T10:30:00Z',
        helpfulCount: 9,
      },
    ],
    downloads: 142,
    karmaReward: 150,
    coverImage: algoCoverImg,
  },
  {
    id: 'sn-2',
    title: 'Distributed Consensus & Raft Protocol State Machine Walkthrough',
    course: 'CS-301 (Distributed Systems)',
    subjectArea: 'Computer Science',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'Lecture Summary',
    summary:
      'Step-by-step Raft safety proof, leader election timers, log replication invariants, split-brain mitigation, and Paxos vs Raft comparison table.',
    content: `# Distributed Consensus & Raft Protocol (CS-301)

## 1. Core Safety Properties
Raft decomposes consensus into three orthogonal subproblems:
1. **Leader Election**: Randomized election timeouts ($150\\text{ms} - 300\\text{ms}$) break symmetry without external coordinators.
2. **Log Replication**: Leader appends client commands as log entries and issues \`AppendEntries\` RPCs in parallel.
3. **Safety Invariant (Log Matching Property)**: If two logs contain an entry with the same index and term, then the logs are identical up through that index.

## 2. Leader Completeness Proof Sketch
- A candidate can only win if its log is at least as up-to-date as any majority quorum (\`lastLogTerm\` higher, or equal term and \`lastLogIndex\` $\\ge$).
- Since committed entries exist on a majority, every future leader shares at least one voter from that quorum.

## 3. Common Exam Edge Cases
- **Figure 8 Scenario**: Leaders never commit log entries from *previous* terms solely by counting replicas; they commit them indirectly by committing an entry from their *current* term.`,
    tags: ['Raft', 'Consensus', 'Distributed Systems', 'Paxos'],
    pagesCount: 16,
    authorName: 'Aditya Sen',
    authorCollege: 'IIT Delhi',
    authorAvatar: adityaAvatarImg,
    isVerified: true,
    createdAt: '2026-03-19T11:20:00Z',
    dateLabel: '3 days ago',
    rating: 5.0,
    reviews: [
      {
        id: 'rev-201',
        authorName: 'Priya Sharma',
        authorCollege: 'IIT Bombay',
        rating: 5,
        comment:
          'Figure 8 edge case explanation is crystal clear — cleared all my confusion before the quiz.',
        createdAt: '2026-03-20T14:10:00Z',
        helpfulCount: 19,
      },
    ],
    downloads: 210,
    karmaReward: 200,
    coverImage: csAlgoImg,
  },
  {
    id: 'sn-3',
    title: 'BCNF, 3NF & Lossless Join Decomposition Proofs + 12 Solved PYQs',
    course: 'CS-304 (Database Systems)',
    subjectArea: 'Computer Science',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'PYQ Solutions',
    summary:
      'Armstrong axioms, canonical cover algorithm worked examples, dependency preservation checks, and 12 solved GATE + university end-sem questions.',
    content: `# Database Normalization & Decomposition Proofs (CS-304)

## 1. Finding Minimal Cover (Canonical Cover $F_c$)
1. Split right-hand sides so every FD has a single attribute on RHS ($X \\to A$).
2. Remove extraneous attributes from LHS ($X \\to A$: test if $(X - \\{B\\})^+ \\ni A$).
3. Remove redundant FDs ($X \\to A$: test if $A \\in X^+$ under $F - \\{X \\to A\\}$).

## 2. 3NF vs BCNF Checklist
- **BCNF**: For every nontrivial $X \\to Y$, $X$ is a superkey. Always lossless decomposition exists; *not* always dependency-preserving.
- **3NF**: For every nontrivial $X \\to A$, either $X$ is a superkey OR $A$ is a prime attribute. Always supports both lossless join and dependency preservation via synthesis algorithm.

## 3. Lossless Join Quick Test (Binary Decomposition)
Decomposing $R$ into $(R_1, R_2)$ is lossless iff:
- $(R_1 \\cap R_2) \\to R_1$ OR $(R_1 \\cap R_2) \\to R_2$ holds in $F^+$.`,
    tags: ['DBMS', 'BCNF', '3NF', 'GATE CS', 'PYQs'],
    pagesCount: 19,
    authorName: 'Rohan Mehta',
    authorCollege: 'BITS Pilani',
    authorAvatar: rohanAvatarImg,
    isVerified: true,
    createdAt: '2026-03-17T09:00:00Z',
    dateLabel: '5 days ago',
    rating: 4.8,
    reviews: [
      {
        id: 'rev-301',
        authorName: 'Kabir Malhotra',
        authorCollege: 'IIIT Hyderabad',
        rating: 5,
        comment: 'Canonical cover step-by-step examples made GATE normalization super easy.',
        createdAt: '2026-03-18T19:00:00Z',
        helpfulCount: 11,
      },
    ],
    downloads: 175,
    karmaReward: 120,
    coverImage: scienceCoverImg,
  },
  {
    id: 'sn-4',
    title: 'Backpropagation, BatchNorm & Transformer Attention Cheat Sheet',
    course: 'CS-303 (AI & Neural Networks)',
    subjectArea: 'Artificial Intelligence',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'Formula Sheet',
    summary:
      'Matrix calculus Jacobians for MLP backprop, scaled dot-product attention dimensional analysis, LayerNorm vs BatchNorm, and vanishing gradient diagnostics.',
    content: `# Neural Networks & Attention Formula Sheet (CS-303)

## 1. Matrix Backpropagation Identities
Given $Z = W X + b$ and upstream gradient $\\delta = \\frac{\\partial \\mathcal{L}}{\\partial Z}$:
- $\\frac{\\partial \\mathcal{L}}{\\partial W} = \\delta X^T$
- $\\frac{\\partial \\mathcal{L}}{\\partial b} = \\sum_{\\text{batch}} \\delta$
- $\\frac{\\partial \\mathcal{L}}{\\partial X} = W^T \\delta$

## 2. Scaled Dot-Product Attention
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$
- Why divide by $\\sqrt{d_k}$? For independent unit-variance components, $\\text{Var}(q \\cdot k) = d_k$. Scaling restores unit variance so softmax avoids saturation regions.

## 3. Normalization Comparison
- **BatchNorm**: Normalizes across $(N, H, W)$ per channel. Depends on batch size; uses running stats at inference.
- **LayerNorm**: Normalizes across $(C, d_{\\text{model}})$ per token. Independent of batch size; standard in Transformers.`,
    tags: ['Deep Learning', 'Transformers', 'Formula Sheet', 'Backprop'],
    pagesCount: 8,
    authorName: 'Aditya Sen',
    authorCollege: 'IIT Delhi',
    authorAvatar: adityaAvatarImg,
    isVerified: true,
    createdAt: '2026-03-15T14:30:00Z',
    dateLabel: '1 week ago',
    rating: 4.9,
    reviews: [],
    downloads: 264,
    karmaReward: 140,
    coverImage: examPrepImg,
  },
  {
    id: 'sn-5',
    title: 'Linear Algebra Eigenvalues, SVD & Quadratic Forms Revision Pack',
    course: 'MA-204 (Engineering Mathematics)',
    subjectArea: 'Mathematics',
    semesterOrTerm: 'Semester 4',
    level: 'Undergraduate',
    format: 'Digital Notes',
    summary:
      'Spectral theorem, positive definiteness tests (Sylvester criterion), Singular Value Decomposition geometry, and low-rank Eckart-Young approximation.',
    content: `# Eigenvalues, SVD & Quadratic Forms (MA-204)

## 1. Spectral Theorem for Real Symmetric Matrices
If $A = A^T \\in \\mathbb{R}^{n \\times n}$:
- All eigenvalues $\\lambda_i$ are real.
- Eigenvectors from distinct eigenvalues are orthogonal.
- $A = Q \\Lambda Q^T$ where $Q$ is orthogonal ($Q^T Q = I$).

## 2. Positive Definiteness Quick Tests
A symmetric matrix $A$ is positive definite ($x^T A x > 0 \\; \\forall x \\neq 0$) iff:
1. All eigenvalues $\\lambda_i > 0$, OR
2. All leading principal minors $\\Delta_1, \\Delta_2, \\dots, \\Delta_n > 0$ (Sylvester's Criterion).

## 3. Singular Value Decomposition (SVD)
Any $A \\in \\mathbb{R}^{m \\times n}$ factors as $A = U \\Sigma V^T$:
- Columns of $V$: eigenvectors of $A^T A$.
- Columns of $U$: eigenvectors of $A A^T$.
- Singular values $\\sigma_i = \\sqrt{\\lambda_i(A^T A)} \\ge 0$.`,
    tags: ['Linear Algebra', 'SVD', 'Mathematics', 'GATE'],
    pagesCount: 14,
    authorName: 'Rohan Mehta',
    authorCollege: 'BITS Pilani',
    authorAvatar: rohanAvatarImg,
    isVerified: true,
    createdAt: '2026-03-12T10:15:00Z',
    dateLabel: '10 days ago',
    rating: 4.7,
    reviews: [],
    downloads: 189,
    karmaReward: 110,
    coverImage: stemImg,
  },
  {
    id: 'sn-6',
    title: 'Class 12 Electrochemistry, Nernst Equation & Conductance High-Yield Notes',
    course: 'CHEM-12 (JEE & Boards)',
    subjectArea: 'Chemistry & JEE',
    semesterOrTerm: 'Class 12',
    level: 'Class 11–12',
    format: 'Formula Sheet',
    summary:
      'Galvanic vs electrolytic cell sign conventions, Nernst equation shortcuts at 298 K, Kohlrausch law numericals, and NCERT exception highlights.',
    content: `# Electrochemistry Complete Revision (Class 12 / JEE)

## 1. Nernst Equation at 298 K
$$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n} \\log_{10} Q$$
- At equilibrium: $E_{\\text{cell}} = 0 \\implies E^\\circ_{\\text{cell}} = \\frac{0.0591}{n} \\log_{10} K_{\\text{eq}}$.
- Gibbs Free Energy: $\\Delta G^\\circ = -n F E^\\circ_{\\text{cell}}$.

## 2. Conductance & Kohlrausch's Law
- Molar Conductivity: $\\Lambda_m = \\frac{\\kappa \\times 1000}{M}$ ($\\text{S cm}^2 \\text{ mol}^{-1}$).
- On dilution: $\\kappa$ decreases (fewer ions per unit volume), while $\\Lambda_m$ increases.
- Weak electrolyte degree of dissociation: $\\alpha = \\frac{\\Lambda_m}{\\Lambda_m^\\circ}$.`,
    tags: ['Electrochemistry', 'JEE Main', 'Class 12', 'NCERT'],
    pagesCount: 11,
    authorName: 'Priya Sharma',
    authorCollege: 'IIT Bombay',
    authorAvatar: priyaAvatarImg,
    isOwnUpload: true,
    isVerified: true,
    createdAt: '2026-03-10T07:45:00Z',
    dateLabel: '12 days ago',
    rating: 4.9,
    reviews: [],
    downloads: 318,
    karmaReward: 130,
    coverImage: scienceCoverImg,
  },
];

export const INITIAL_NOTE_REQUESTS: NoteRequestItem[] = [
  {
    id: 'req-1',
    title: 'Operating Systems Virtual Memory & Page Replacement Solved Numericals',
    course: 'CS-305 (Operating Systems)',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    details:
      'Looking for clean handwritten or typed notes covering Multi-level Page Tables, TLB effective access time numericals, and Belady anomaly examples for upcoming Mid-Sem.',
    requesterName: 'Meera Krishnan',
    requesterCollege: 'NIT Trichy',
    bountyKarma: 75,
    upvotes: 28,
    status: 'open',
    createdAt: '2026-03-21T19:00:00Z',
    dateLabel: '1 day ago',
  },
  {
    id: 'req-2',
    title: 'Convex Optimization KKT Conditions & Lagrangian Duality Examples',
    course: 'CS-303 (AI & Neural Networks)',
    semesterOrTerm: 'Semester 6',
    level: 'Postgraduate',
    details:
      'Need worked examples of complementary slackness and strong duality (Slater condition) relevant for ML & SVM derivations.',
    requesterName: 'Arjun Deshmukh',
    requesterCollege: 'IIT Madras',
    bountyKarma: 100,
    upvotes: 19,
    status: 'open',
    createdAt: '2026-03-20T15:30:00Z',
    dateLabel: '2 days ago',
  },
  {
    id: 'req-3',
    title: 'Raft Leader Election Edge Cases & Safety Invariant Proofs',
    course: 'CS-301 (Distributed Systems)',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    details: 'Need crisp notes covering Figure 8 commitment rule and log matching proof.',
    requesterName: 'Tanvi Joshi',
    requesterCollege: 'IIT Bombay',
    bountyKarma: 80,
    upvotes: 41,
    status: 'fulfilled',
    fulfilledNoteId: 'sn-2',
    createdAt: '2026-03-18T11:00:00Z',
    dateLabel: '4 days ago',
  },
];

export const INITIAL_NOTES_EXCHANGE_STATE: NotesExchangeState = {
  notes: INITIAL_SHARED_NOTES,
  requests: INITIAL_NOTE_REQUESTS,
  savedNoteIds: ['sn-2', 'sn-4'],
  downloadedNoteIds: ['sn-2'],
  karmaPoints: 1420,
  karmaHistory: [
    {
      id: 'kh-1',
      event: 'Published "Handwritten Graph Theory, Treewidth & DP on Trees"',
      points: 150,
      createdAt: '2026-03-21T16:40:00Z',
      dateLabel: 'Yesterday',
    },
    {
      id: 'kh-2',
      event: 'Note downloaded by 25+ verified peers (Quality Milestone)',
      points: 50,
      createdAt: '2026-03-19T12:00:00Z',
      dateLabel: '3 days ago',
    },
    {
      id: 'kh-3',
      event: 'Published "Class 12 Electrochemistry High-Yield Notes"',
      points: 130,
      createdAt: '2026-03-10T07:45:00Z',
      dateLabel: '12 days ago',
    },
  ],
  reportedNoteIds: [],
};
