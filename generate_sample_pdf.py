import fitz  # PyMuPDF
import os

def create_sample_pdf(output_path):
    doc = fitz.open()

    # Color palette (RGB normalized 0-1)
    amber_gold = (0.96, 0.65, 0.14)      # #F59E0B
    dark_amber = (0.85, 0.50, 0.05)
    charcoal_dark = (0.10, 0.12, 0.16)   # #1A1F2C
    card_bg = (0.97, 0.97, 0.98)
    card_border = (0.88, 0.88, 0.90)
    text_dark = (0.12, 0.12, 0.14)
    text_muted = (0.35, 0.38, 0.44)
    brand_blue = (0.15, 0.38, 0.75)
    green_accent = (0.10, 0.60, 0.35)

    # -------------------------------------------------------------
    # PAGE 1: Blockchain Architecture & EVM Mechanics
    # -------------------------------------------------------------
    page1 = doc.new_page(width=595, height=842) # A4 dimensions in points
    
    # Outer margin boundary
    margin = 36
    w = 595
    h = 842

    # Top Brand Header Banner
    header_rect = fitz.Rect(margin, margin, w - margin, margin + 55)
    page1.draw_rect(header_rect, color=charcoal_dark, fill=charcoal_dark)
    
    # Header Accent bar
    accent_bar = fitz.Rect(margin, margin, margin + 6, margin + 55)
    page1.draw_rect(accent_bar, color=amber_gold, fill=amber_gold)

    # Title & Subtitle inside header
    page1.insert_text(fitz.Point(margin + 18, margin + 24), "EDUSPHERE ACADEMY", fontsize=15, fontname="helv", color=amber_gold)
    page1.insert_text(fitz.Point(margin + 18, margin + 42), "Verified Course Study Notes & Automated Test Dataset | Module 1", fontsize=9, fontname="helv", color=(0.85, 0.88, 0.92))
    
    # Badge on right side
    badge_rect = fitz.Rect(w - margin - 120, margin + 16, w - margin - 15, margin + 38)
    page1.draw_rect(badge_rect, color=dark_amber, fill=dark_amber)
    page1.insert_text(fitz.Point(w - margin - 110, margin + 31), "TEST FILE: EDU-01", fontsize=8, fontname="helv", color=(1, 1, 1))

    # Document Meta info box
    meta_rect = fitz.Rect(margin, margin + 65, w - margin, margin + 98)
    page1.draw_rect(meta_rect, color=card_border, fill=card_bg)
    page1.insert_text(fitz.Point(margin + 12, margin + 80), "Subject: Web3 & Distributed Systems Architecture", fontsize=8.5, fontname="helv", color=text_dark)
    page1.insert_text(fitz.Point(margin + 12, margin + 92), "Instructor: Prof. Pramila Chawan   |   Format: Core Lecture Notes (Pages 1 & 2)", fontsize=8, fontname="helv", color=text_muted)
    page1.insert_text(fitz.Point(w - margin - 125, margin + 86), "Academic Year: 2026", fontsize=8.5, fontname="helv", color=brand_blue)

    # Section 1: Overview
    y = margin + 120
    page1.draw_rect(fitz.Rect(margin, y - 10, margin + 4, y + 4), color=amber_gold, fill=amber_gold)
    page1.insert_text(fitz.Point(margin + 10, y), "1. FUNDAMENTALS OF DISTRIBUTED LEDGER TECHNOLOGY", fontsize=11, fontname="helv", color=text_dark)

    sec1_text = (
        "Blockchain is a decentralized, distributed, and append-only ledger that maintains an immutable "
        "record of transactions across a peer-to-peer network. Every participant (node) maintains an identical "
        "copy of the ledger, eliminating the need for centralized intermediaries."
    )
    y += 18
    page1.insert_textbox(fitz.Rect(margin, y, w - margin, y + 36), sec1_text, fontsize=8.5, fontname="helv", color=text_dark)

    # Key Architecture Points
    y += 42
    points = [
        ("Decentralized Consensus", "Transactions are verified by cryptographic consensus algorithms (e.g. Proof of Stake, Proof of Work) rather than a single central clearinghouse."),
        ("Cryptographic Hashing", "Blocks are chained using SHA-256 or Keccak-256 cryptographic hashes. Altering any prior block invalidates all subsequent block hashes."),
        ("Merkle Tree Verification", "Transactions in a block are organized into Merkle Trees, allowing logarithmic O(log n) cryptographic proof of transaction inclusion."),
        ("State Immutability", "Once confirmed by network consensus, transaction records cannot be modified, deleted, or backdated.")
    ]

    for title, desc in points:
        page1.draw_circle(fitz.Point(margin + 6, y + 4), 3, color=amber_gold, fill=amber_gold)
        page1.insert_text(fitz.Point(margin + 16, y + 7), f"{title}:", fontsize=8.5, fontname="helv", color=brand_blue)
        page1.insert_text(fitz.Point(margin + 130, y + 7), desc, fontsize=8.5, fontname="helv", color=text_dark)
        y += 20

    # Section 2: EVM Memory Layout & Gas Economics
    y += 15
    page1.draw_rect(fitz.Rect(margin, y - 10, margin + 4, y + 4), color=amber_gold, fill=amber_gold)
    page1.insert_text(fitz.Point(margin + 10, y), "2. ETHEREUM VIRTUAL MACHINE (EVM) MEMORY & GAS MECHANICS", fontsize=11, fontname="helv", color=text_dark)

    y += 16
    sec2_text = (
        "The Ethereum Virtual Machine (EVM) is a quasi-Turing complete runtime environment that executes "
        "smart contract bytecode. Computational operations require Gas payments to prevent infinite loops and denial-of-service."
    )
    page1.insert_textbox(fitz.Rect(margin, y, w - margin, y + 26), sec2_text, fontsize=8.5, fontname="helv", color=text_dark)

    # EVM Memory Comparison Table
    y += 34
    table_rect = fitz.Rect(margin, y, w - margin, y + 105)
    page1.draw_rect(table_rect, color=card_border, fill=card_bg)

    # Header Row
    page1.draw_rect(fitz.Rect(margin, y, w - margin, y + 22), color=charcoal_dark, fill=charcoal_dark)
    page1.insert_text(fitz.Point(margin + 10, y + 15), "Memory Area", fontsize=8, fontname="helv", color=amber_gold)
    page1.insert_text(fitz.Point(margin + 90, y + 15), "Persistence & Scope", fontsize=8, fontname="helv", color=(1, 1, 1))
    page1.insert_text(fitz.Point(margin + 230, y + 15), "Gas Cost", fontsize=8, fontname="helv", color=(1, 1, 1))
    page1.insert_text(fitz.Point(margin + 330, y + 15), "Primary Purpose & Behavior", fontsize=8, fontname="helv", color=(1, 1, 1))

    table_rows = [
        ("Storage", "Permanent (Blockchain State)", "Extremely High (2,100 - 20,000 gas)", "Stores contract state variables between txs."),
        ("Memory", "Temporary (Function Call)", "Low (3 gas + quadratic expansion)", "Holds mutable variables during computation."),
        ("Calldata", "Temporary (Function Call)", "Very Low (Read-only buffer)", "Stores incoming immutable function arguments."),
        ("Stack", "Ephemeral (1024 depth)", "Cheapest (Minimal gas)", "Holds raw 256-bit machine registers.")
    ]

    row_y = y + 36
    for area, persist, cost, purpose in table_rows:
        page1.insert_text(fitz.Point(margin + 10, row_y), area, fontsize=8, fontname="helv", color=brand_blue)
        page1.insert_text(fitz.Point(margin + 90, row_y), persist, fontsize=7.5, fontname="helv", color=text_dark)
        page1.insert_text(fitz.Point(margin + 230, row_y), cost, fontsize=7.5, fontname="helv", color=dark_amber)
        page1.insert_text(fitz.Point(margin + 330, row_y), purpose, fontsize=7.5, fontname="helv", color=text_muted)
        page1.draw_line(fitz.Point(margin + 5, row_y + 4), fitz.Point(w - margin - 5, row_y + 4), color=card_border, width=0.5)
        row_y += 18

    # Section 3: Formula & Calculations
    y = row_y + 12
    page1.draw_rect(fitz.Rect(margin, y - 10, margin + 4, y + 4), color=amber_gold, fill=amber_gold)
    page1.insert_text(fitz.Point(margin + 10, y), "3. EIP-1559 TRANSACTION FEE FORMULA", fontsize=11, fontname="helv", color=text_dark)

    y += 14
    formula_box = fitz.Rect(margin, y, w - margin, y + 48)
    page1.draw_rect(formula_box, color=amber_gold, fill=(0.99, 0.98, 0.94), width=1)
    page1.insert_text(fitz.Point(margin + 15, y + 20), "Total Transaction Fee = Gas Units Consumed * (Base Fee + Priority Fee / Tip)", fontsize=9.5, fontname="helv", color=charcoal_dark)
    page1.insert_text(fitz.Point(margin + 15, y + 36), "Note: The Base Fee is burned protocol-wide, while the Priority Fee (Tip) goes directly to block validators.", fontsize=8, fontname="helv", color=text_muted)

    # Page 1 Footer
    footer_y = h - margin - 10
    page1.draw_line(fitz.Point(margin, footer_y), fitz.Point(w - margin, footer_y), color=card_border, width=0.8)
    page1.insert_text(fitz.Point(margin, footer_y + 16), "Edusphere Web3 Decentralized LMS  *  https://edusphere.edu", fontsize=8, fontname="helv", color=text_muted)
    page1.insert_text(fitz.Point(w - margin - 75, footer_y + 16), "Page 1 of 2", fontsize=8.5, fontname="helv", color=charcoal_dark)

    # -------------------------------------------------------------
    # PAGE 2: Security Auditing, Smart Contracts & Assessment MCQs
    # -------------------------------------------------------------
    page2 = doc.new_page(width=595, height=842)

    # Top Brand Header Banner (Page 2)
    header_rect2 = fitz.Rect(margin, margin, w - margin, margin + 55)
    page2.draw_rect(header_rect2, color=charcoal_dark, fill=charcoal_dark)
    
    accent_bar2 = fitz.Rect(margin, margin, margin + 6, margin + 55)
    page2.draw_rect(accent_bar2, color=amber_gold, fill=amber_gold)

    page2.insert_text(fitz.Point(margin + 18, margin + 24), "EDUSPHERE ACADEMY", fontsize=15, fontname="helv", color=amber_gold)
    page2.insert_text(fitz.Point(margin + 18, margin + 42), "Verified Course Study Notes & Automated Test Dataset | Module 2", fontsize=9, fontname="helv", color=(0.85, 0.88, 0.92))
    
    badge_rect2 = fitz.Rect(w - margin - 120, margin + 16, w - margin - 15, margin + 38)
    page2.draw_rect(badge_rect2, color=dark_amber, fill=dark_amber)
    page2.insert_text(fitz.Point(w - margin - 110, margin + 31), "TEST FILE: EDU-02", fontsize=8, fontname="helv", color=(1, 1, 1))

    # Section 4: Solidity Security & Attack Vectors
    y2 = margin + 75
    page2.draw_rect(fitz.Rect(margin, y2 - 10, margin + 4, y2 + 4), color=amber_gold, fill=amber_gold)
    page2.insert_text(fitz.Point(margin + 10, y2), "4. SOLIDITY SECURITY, VULNERABILITIES & BEST PRACTICES", fontsize=11, fontname="helv", color=text_dark)

    y2 += 16
    vuln_points = [
        ("Reentrancy Attacks", "Occurs when an external contract call transfers control back to the calling contract before its state (balance) is updated. Defense: Follow the Checks-Effects-Interactions (CEI) pattern or use OpenZeppelin ReentrancyGuard nonReentrant modifier."),
        ("Arithmetic Overflow / Underflow", "In Solidity versions prior to 0.8.0, arithmetic operations silently wrapped around. In Solidity 0.8+, all math operations automatically revert on overflow unless wrapped in an explicit unchecked { ... } block."),
        ("Access Control Flaws", "Failing to restrict administrative functions (e.g. mint, pause, withdraw) allows attackers to drain assets. Defense: Implement strict Ownable or AccessControl modifiers like onlyOwner."),
        ("tx.origin Phishing", "Using tx.origin for authentication allows malicious intermediary contracts to impersonate users. Always authenticate using msg.sender.")
    ]

    for title, desc in vuln_points:
        page2.draw_circle(fitz.Point(margin + 6, y2 + 4), 3, color=amber_gold, fill=amber_gold)
        page2.insert_text(fitz.Point(margin + 16, y2 + 7), f"{title}:", fontsize=8.5, fontname="helv", color=brand_blue)
        page2.insert_textbox(fitz.Rect(margin + 16, y2 + 10, w - margin, y2 + 35), desc, fontsize=8, fontname="helv", color=text_dark)
        y2 += 36

    # Section 5: Token Standards Summary
    y2 += 8
    page2.draw_rect(fitz.Rect(margin, y2 - 10, margin + 4, y2 + 4), color=amber_gold, fill=amber_gold)
    page2.insert_text(fitz.Point(margin + 10, y2), "5. ETHEREUM TOKEN STANDARDS (ERC DEFINITIONS)", fontsize=11, fontname="helv", color=text_dark)

    y2 += 14
    token_box = fitz.Rect(margin, y2, w - margin, y2 + 60)
    page2.draw_rect(token_box, color=card_border, fill=card_bg)

    standards = [
        ("ERC-20", "Fungible Tokens", "Uniform units where each token has identical value. Uses allowance(owner, spender) to delegate approvals."),
        ("ERC-721", "Non-Fungible Tokens (NFTs)", "Represents unique, indivisible digital assets where each item is identified by a unique tokenId."),
        ("ERC-1155", "Multi-Token Standard", "Hybrid standard supporting batch transfers of fungible and non-fungible items within a single contract.")
    ]

    st_y = y2 + 15
    for std, label, exp in standards:
        page2.insert_text(fitz.Point(margin + 12, st_y), std, fontsize=8.5, fontname="helv", color=brand_blue)
        page2.insert_text(fitz.Point(margin + 75, st_y), f"({label}):", fontsize=8, fontname="helv", color=dark_amber)
        page2.insert_text(fitz.Point(margin + 190, st_y), exp, fontsize=8, fontname="helv", color=text_dark)
        st_y += 16

    # Section 6: Sample Multiple Choice Questions for Automated Test Builder
    y2 += 75
    page2.draw_rect(fitz.Rect(margin, y2 - 10, margin + 4, y2 + 4), color=amber_gold, fill=amber_gold)
    page2.insert_text(fitz.Point(margin + 10, y2), "6. SAMPLE PRACTICE QUESTIONS FOR TEST EVALUATION", fontsize=11, fontname="helv", color=text_dark)

    y2 += 14
    sample_mcqs = [
        {
            "q": "Q1: Which EVM data area consumes the lowest gas for incoming immutable function arguments?",
            "opts": "A) Storage   B) Memory   C) Calldata   D) Log Topics",
            "ans": "Correct Answer: C (Calldata) | Explanation: Calldata is a read-only byte array allocated for transaction input arguments."
        },
        {
            "q": "Q2: What is the primary function modifier pattern used to prevent reentrancy attacks in Solidity?",
            "opts": "A) Checks-Effects-Interactions   B) Fallback Assembly   C) Tx-Origin Guard   D) DelegateCall Loop",
            "ans": "Correct Answer: A (Checks-Effects-Interactions) | Explanation: Updating state balances before external calls stops recursive exploitation."
        },
        {
            "q": "Q3: In Solidity 0.8+, how does the EVM natively handle arithmetic overflow (e.g. uint256 max + 1)?",
            "opts": "A) Silently wraps to zero   B) Reverts transaction automatically   C) Emits warning event   D) Halts block execution",
            "ans": "Correct Answer: B (Reverts transaction) | Explanation: Solidity 0.8+ integrates checked arithmetic, triggering automatic Panic(0x11)."
        }
    ]

    for mcq in sample_mcqs:
        q_box = fitz.Rect(margin, y2, w - margin, y2 + 44)
        page2.draw_rect(q_box, color=card_border, fill=card_bg)
        page2.insert_text(fitz.Point(margin + 10, y2 + 13), mcq["q"], fontsize=8, fontname="helv", color=charcoal_dark)
        page2.insert_text(fitz.Point(margin + 20, y2 + 26), mcq["opts"], fontsize=7.5, fontname="helv", color=brand_blue)
        page2.insert_text(fitz.Point(margin + 20, y2 + 38), mcq["ans"], fontsize=7, fontname="helv", color=green_accent)
        y2 += 50

    # Page 2 Footer
    footer_y2 = h - margin - 10
    page2.draw_line(fitz.Point(margin, footer_y2), fitz.Point(w - margin, footer_y2), color=card_border, width=0.8)
    page2.insert_text(fitz.Point(margin, footer_y2 + 16), "Edusphere Web3 Decentralized LMS  *  https://edusphere.edu", fontsize=8, fontname="helv", color=text_muted)
    page2.insert_text(fitz.Point(w - margin - 75, footer_y2 + 16), "Page 2 of 2", fontsize=8.5, fontname="helv", color=charcoal_dark)

    # Save to disk
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Successfully generated 2-page PDF at: {output_path}")

if __name__ == "__main__":
    out_file = r"c:\Projects\Edusphere-main\Edusphere_Sample_Test_Notes.pdf"
    create_sample_pdf(out_file)
    
    # Also copy to Frontend/public/ for browser download
    pub_file = r"c:\Projects\Edusphere-main\Frontend\public\Edusphere_Sample_Test_Notes.pdf"
    create_sample_pdf(pub_file)
