#!/usr/bin/env python3
"""Find PDFs with null bytes or other problematic characters."""

import sys
from pathlib import Path

import fitz  # PyMuPDF


def check_pdf(pdf_path: Path) -> dict | None:
    """Check a PDF for problematic characters. Returns issues dict or None if clean."""
    issues = {
        "path": str(pdf_path),
        "null_bytes": False,
        "control_chars": False,
        "pages_with_issues": [],
    }

    try:
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text()

            if "\x00" in text:
                issues["null_bytes"] = True
                issues["pages_with_issues"].append(page_num)

            # Check for other control characters (excluding newline, tab, carriage return)
            for char in text:
                if ord(char) < 32 and char not in "\n\t\r":
                    issues["control_chars"] = True
                    if page_num not in issues["pages_with_issues"]:
                        issues["pages_with_issues"].append(page_num)
                    break

        doc.close()

        if issues["null_bytes"] or issues["control_chars"]:
            return issues
        return None

    except Exception as e:
        return {
            "path": str(pdf_path),
            "error": str(e),
        }


def main(directory: str):
    """Scan directory for problematic PDFs."""
    path = Path(directory)

    if not path.exists():
        print(f"Directory not found: {path}")
        sys.exit(1)

    pdf_files = list(path.rglob("*.pdf"))
    print(f"Scanning {len(pdf_files)} PDF files...\n")

    bad_pdfs = []
    error_pdfs = []

    for i, pdf_path in enumerate(pdf_files, start=1):
        if i % 100 == 0:
            print(f"  Checked {i}/{len(pdf_files)}...")

        result = check_pdf(pdf_path)
        if result:
            if "error" in result:
                error_pdfs.append(result)
            else:
                bad_pdfs.append(result)

    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"{'='*60}\n")

    if bad_pdfs:
        print(f"PDFs with problematic characters ({len(bad_pdfs)}):\n")
        for pdf in bad_pdfs:
            print(f"  {pdf['path']}")
            issues = []
            if pdf["null_bytes"]:
                issues.append("null bytes")
            if pdf["control_chars"]:
                issues.append("control chars")
            print(f"    Issues: {', '.join(issues)}")
            print(f"    Pages: {pdf['pages_with_issues'][:5]}{'...' if len(pdf['pages_with_issues']) > 5 else ''}")
            print()
    else:
        print("No PDFs with problematic characters found.\n")

    if error_pdfs:
        print(f"\nPDFs that couldn't be read ({len(error_pdfs)}):\n")
        for pdf in error_pdfs:
            print(f"  {pdf['path']}")
            print(f"    Error: {pdf['error']}")
            print()

    print(f"Summary: {len(bad_pdfs)} problematic, {len(error_pdfs)} errors, {len(pdf_files) - len(bad_pdfs) - len(error_pdfs)} clean")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        # Default to the case documents path
        directory = "/Users/doctorew/Library/CloudStorage/Dropbox/__DOCTOREW.COM__/LHS Kitchen ChatDocs/LHS Docs of SW Jan 31 2026"

    main(directory)
