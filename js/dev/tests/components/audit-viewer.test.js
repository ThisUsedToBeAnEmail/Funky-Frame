/**
 * Tests for Funky.AuditViewer
 * Interactive audit trail visualization component
 */
FunkyTests.describe('Funky.Component.AuditViewer', function() {
    var expect = FunkyTests.expect;
    var fixture;

    /**
     * Convert Funky.Dom element or string to HTML string for testing
     */
    function toHtml(result) {
        if (typeof result === 'string') return result;
        if (result && result.el) return result.el.outerHTML;
        if (result instanceof HTMLElement) return result.outerHTML;
        return String(result);
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        if (Funky.AuditViewer) {
            Funky.AuditViewer._data = [];
            Funky.AuditViewer.auditTable = null;
            Funky.AuditViewer.currentEntry = null;
        }
        fixture.cleanup();
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.AuditViewer).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof Funky.AuditViewer.init).toBe('function');
        });

        FunkyTests.it('has loadStats method', function() {
            expect(typeof Funky.AuditViewer.loadStats).toBe('function');
        });

        FunkyTests.it('has loadRecentTimeline method', function() {
            expect(typeof Funky.AuditViewer.loadRecentTimeline).toBe('function');
        });

        FunkyTests.it('has loadTableStats method', function() {
            expect(typeof Funky.AuditViewer.loadTableStats).toBe('function');
        });

        FunkyTests.it('has initFilters method', function() {
            expect(typeof Funky.AuditViewer.initFilters).toBe('function');
        });

        FunkyTests.it('has showDetail method', function() {
            expect(typeof Funky.AuditViewer.showDetail).toBe('function');
        });

        FunkyTests.it('has renderDiff method', function() {
            expect(typeof Funky.AuditViewer.renderDiff).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof Funky.AuditViewer.destroy).toBe('function');
        });
    });

    FunkyTests.describe('Configuration', function() {
        FunkyTests.it('has operationColors', function() {
            expect(Funky.AuditViewer.operationColors).toBeDefined();
            expect(Funky.AuditViewer.operationColors.create).toBeDefined();
            expect(Funky.AuditViewer.operationColors.update).toBeDefined();
            expect(Funky.AuditViewer.operationColors.delete).toBeDefined();
        });

        FunkyTests.it('has tableIcons', function() {
            expect(Funky.AuditViewer.tableIcons).toBeDefined();
            expect(Funky.AuditViewer.tableIcons.trades).toBe('fa-exchange-alt');
            expect(Funky.AuditViewer.tableIcons.clients).toBe('fa-building');
        });

        FunkyTests.it('has currentDiffView property', function() {
            expect(Funky.AuditViewer.currentDiffView).toBe('split');
        });
    });

    FunkyTests.describe('Utility methods', function() {
        FunkyTests.describe('formatDateTime()', function() {
            FunkyTests.it('returns dash for null', function() {
                expect(Funky.AuditViewer.formatDateTime(null)).toBe('-');
            });

            FunkyTests.it('returns dash for undefined', function() {
                expect(Funky.AuditViewer.formatDateTime(undefined)).toBe('-');
            });

            FunkyTests.it('formats valid date string', function() {
                var result = Funky.AuditViewer.formatDateTime('2024-01-15T10:30:00Z');
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });

        FunkyTests.describe('formatDate()', function() {
            FunkyTests.it('returns dash for null', function() {
                expect(Funky.AuditViewer.formatDate(null)).toBe('-');
            });

            FunkyTests.it('formats valid date string', function() {
                var result = Funky.AuditViewer.formatDate('2024-01-15');
                expect(typeof result).toBe('string');
            });
        });

        FunkyTests.describe('formatRelativeTime()', function() {
            FunkyTests.it('returns dash for null', function() {
                expect(Funky.AuditViewer.formatRelativeTime(null)).toBe('-');
            });

            FunkyTests.it('returns "Just now" for recent time', function() {
                var now = new Date().toISOString();
                var result = Funky.AuditViewer.formatRelativeTime(now);
                expect(result).toBe('Just now');
            });
        });

        FunkyTests.describe('formatTableName()', function() {
            FunkyTests.it('returns dash for null', function() {
                expect(Funky.AuditViewer.formatTableName(null)).toBe('-');
            });

            FunkyTests.it('capitalizes words', function() {
                expect(Funky.AuditViewer.formatTableName('trade_actions')).toBe('Trade Actions');
            });

            FunkyTests.it('handles single word', function() {
                expect(Funky.AuditViewer.formatTableName('trades')).toBe('Trades');
            });
        });

        FunkyTests.describe('formatFieldName()', function() {
            FunkyTests.it('returns dash for null', function() {
                expect(Funky.AuditViewer.formatFieldName(null)).toBe('-');
            });

            FunkyTests.it('capitalizes words', function() {
                expect(Funky.AuditViewer.formatFieldName('created_at')).toBe('Created At');
            });
        });

        FunkyTests.describe('formatValue()', function() {
            FunkyTests.it('handles undefined', function() {
                var result = toHtml(Funky.AuditViewer.formatValue(undefined));
                expect(result).toContain('undefined');
            });

            FunkyTests.it('handles null', function() {
                var result = toHtml(Funky.AuditViewer.formatValue(null));
                expect(result).toContain('null');
            });

            FunkyTests.it('handles boolean', function() {
                var result = toHtml(Funky.AuditViewer.formatValue(true));
                expect(result).toContain('true');
            });

            FunkyTests.it('handles number', function() {
                var result = toHtml(Funky.AuditViewer.formatValue(42));
                expect(result).toContain('42');
            });

            FunkyTests.it('handles string', function() {
                var result = toHtml(Funky.AuditViewer.formatValue('test'));
                expect(result).toContain('test');
            });

            FunkyTests.it('handles object', function() {
                var result = toHtml(Funky.AuditViewer.formatValue({ a: 1 }));
                expect(result).toContain('{');
            });

            FunkyTests.it('truncates long strings', function() {
                var longString = 'a'.repeat(150);
                var result = toHtml(Funky.AuditViewer.formatValue(longString));
                expect(result).toContain('...');
            });
        });

        FunkyTests.describe('renderOperationBadge()', function() {
            FunkyTests.it('renders create badge', function() {
                var result = toHtml(Funky.AuditViewer.renderOperationBadge('create'));
                expect(result).toContain('operation-create');
                expect(result).toContain('Created');
            });

            FunkyTests.it('renders update badge', function() {
                var result = toHtml(Funky.AuditViewer.renderOperationBadge('update'));
                expect(result).toContain('operation-update');
                expect(result).toContain('Updated');
            });

            FunkyTests.it('renders delete badge', function() {
                var result = toHtml(Funky.AuditViewer.renderOperationBadge('delete'));
                expect(result).toContain('operation-delete');
                expect(result).toContain('Deleted');
            });

            FunkyTests.it('includes aria-label', function() {
                var result = toHtml(Funky.AuditViewer.renderOperationBadge('create'));
                expect(result).toContain('aria-label');
            });
        });

        FunkyTests.describe('getOperationIcon()', function() {
            FunkyTests.it('returns plus for create', function() {
                expect(Funky.AuditViewer.getOperationIcon('create')).toBe('fa-plus');
            });

            FunkyTests.it('returns edit for update', function() {
                expect(Funky.AuditViewer.getOperationIcon('update')).toBe('fa-edit');
            });

            FunkyTests.it('returns trash for delete', function() {
                expect(Funky.AuditViewer.getOperationIcon('delete')).toBe('fa-trash');
            });

            FunkyTests.it('returns question for unknown', function() {
                expect(Funky.AuditViewer.getOperationIcon('unknown')).toBe('fa-question');
            });
        });
    });

    FunkyTests.describe('Diff rendering', function() {
        FunkyTests.describe('renderSplitDiff()', function() {
            FunkyTests.it('renders split diff container', function() {
                var result = toHtml(Funky.AuditViewer.renderSplitDiff(
                    { name: 'old' },
                    { name: 'new' }
                ));
                expect(result).toContain('diff-split');
                expect(result).toContain('diff-old');
                expect(result).toContain('diff-new');
            });

            FunkyTests.it('handles null old values', function() {
                var result = toHtml(Funky.AuditViewer.renderSplitDiff(null, { name: 'new' }));
                expect(result).toContain('diff-split');
            });

            FunkyTests.it('handles null new values', function() {
                var result = toHtml(Funky.AuditViewer.renderSplitDiff({ name: 'old' }, null));
                expect(result).toContain('diff-split');
            });

            FunkyTests.it('marks changed fields', function() {
                var result = toHtml(Funky.AuditViewer.renderSplitDiff(
                    { name: 'old', unchanged: 'same' },
                    { name: 'new', unchanged: 'same' }
                ));
                expect(result).toContain('diff-changed');
            });

            FunkyTests.it('includes accessibility labels', function() {
                var result = toHtml(Funky.AuditViewer.renderSplitDiff({ a: 1 }, { a: 2 }));
                expect(result).toContain('aria-label');
                expect(result).toContain('role="region"');
            });
        });

        FunkyTests.describe('renderUnifiedDiff()', function() {
            FunkyTests.it('renders unified diff container', function() {
                var result = toHtml(Funky.AuditViewer.renderUnifiedDiff(
                    { name: 'old' },
                    { name: 'new' }
                ));
                expect(result).toContain('diff-unified');
            });

            FunkyTests.it('shows added lines', function() {
                var result = toHtml(Funky.AuditViewer.renderUnifiedDiff(
                    {},
                    { newField: 'value' }
                ));
                expect(result).toContain('diff-added');
            });

            FunkyTests.it('shows removed lines', function() {
                var result = toHtml(Funky.AuditViewer.renderUnifiedDiff(
                    { oldField: 'value' },
                    {}
                ));
                expect(result).toContain('diff-removed');
            });
        });

        FunkyTests.describe('renderChangesOnlyDiff()', function() {
            FunkyTests.it('shows only changed fields', function() {
                var result = toHtml(Funky.AuditViewer.renderChangesOnlyDiff(
                    { name: 'old', unchanged: 'same' },
                    { name: 'new', unchanged: 'same' }
                ));
                expect(result).toContain('diff-changes-only');
                expect(result).toContain('name');
            });

            FunkyTests.it('shows no changes message when identical', function() {
                var result = toHtml(Funky.AuditViewer.renderChangesOnlyDiff(
                    { name: 'same' },
                    { name: 'same' }
                ));
                expect(result).toContain('No changes detected');
            });

            FunkyTests.it('shows from/to labels', function() {
                var result = toHtml(Funky.AuditViewer.renderChangesOnlyDiff(
                    { value: 1 },
                    { value: 2 }
                ));
                expect(result).toContain('From:');
                expect(result).toContain('To:');
            });
        });
    });

    FunkyTests.describe('Bindable Interface', function() {
        FunkyTests.describe('setData()', function() {
            FunkyTests.it('accepts array of entries', function() {
                var entries = [
                    { id: 1, operation: 'create' },
                    { id: 2, operation: 'update' }
                ];
                Funky.AuditViewer.setData(entries);
                expect(Funky.AuditViewer._data.length).toBe(2);
            });

            FunkyTests.it('accepts object with records property', function() {
                var data = { records: [{ id: 1 }] };
                Funky.AuditViewer.setData(data);
                expect(Funky.AuditViewer._data.length).toBe(1);
            });

            FunkyTests.it('handles empty array', function() {
                Funky.AuditViewer.setData([]);
                expect(Funky.AuditViewer._data.length).toBe(0);
            });

            FunkyTests.it('handles null/undefined', function() {
                Funky.AuditViewer.setData(null);
                expect(Funky.AuditViewer._data.length).toBe(0);
            });
        });

        FunkyTests.describe('addData()', function() {
            FunkyTests.it('appends single entry', function() {
                Funky.AuditViewer._data = [{ id: 1 }];
                Funky.AuditViewer.addData({ id: 2 });
                expect(Funky.AuditViewer._data.length).toBe(2);
            });

            FunkyTests.it('appends array of entries', function() {
                Funky.AuditViewer._data = [{ id: 1 }];
                Funky.AuditViewer.addData([{ id: 2 }, { id: 3 }]);
                expect(Funky.AuditViewer._data.length).toBe(3);
            });
        });

        FunkyTests.describe('getData()', function() {
            FunkyTests.it('returns current data', function() {
                Funky.AuditViewer._data = [{ id: 1 }, { id: 2 }];
                var data = Funky.AuditViewer.getData();
                expect(data.length).toBe(2);
            });

            FunkyTests.it('returns empty array when no data', function() {
                Funky.AuditViewer._data = [];
                var data = Funky.AuditViewer.getData();
                expect(data.length).toBe(0);
            });
        });

        FunkyTests.describe('clearData()', function() {
            FunkyTests.it('clears all data', function() {
                Funky.AuditViewer._data = [{ id: 1 }, { id: 2 }];
                Funky.AuditViewer.clearData();
                expect(Funky.AuditViewer._data.length).toBe(0);
            });
        });
    });

    FunkyTests.describe('Timeline rendering', function() {
        FunkyTests.describe('renderTimelineItem()', function() {
            FunkyTests.it('renders timeline item structure', function() {
                var entry = {
                    id: 1,
                    operation: 'create',
                    table_name: 'trades',
                    record_id: 123,
                    username: 'testuser',
                    created_at: new Date().toISOString()
                };
                var result = toHtml(Funky.AuditViewer.renderTimelineItem(entry));
                expect(result).toContain('timeline-item');
                expect(result).toContain('timeline-marker');
                expect(result).toContain('timeline-content');
            });

            FunkyTests.it('includes table icon', function() {
                var entry = {
                    id: 1,
                    operation: 'update',
                    table_name: 'trades',
                    record_id: 1,
                    created_at: new Date().toISOString()
                };
                var result = toHtml(Funky.AuditViewer.renderTimelineItem(entry));
                expect(result).toContain('fa-exchange-alt');
            });

            FunkyTests.it('includes operation badge', function() {
                var entry = {
                    id: 1,
                    operation: 'delete',
                    table_name: 'clients',
                    record_id: 1,
                    created_at: new Date().toISOString()
                };
                var result = toHtml(Funky.AuditViewer.renderTimelineItem(entry));
                expect(result).toContain('Deleted');
            });

            FunkyTests.it('shows System for null username', function() {
                var entry = {
                    id: 1,
                    operation: 'create',
                    table_name: 'trades',
                    record_id: 1,
                    username: null,
                    created_at: new Date().toISOString()
                };
                var result = toHtml(Funky.AuditViewer.renderTimelineItem(entry));
                expect(result).toContain('System');
            });

            FunkyTests.it('includes accessibility attributes', function() {
                var entry = {
                    id: 1,
                    operation: 'create',
                    table_name: 'trades',
                    record_id: 1,
                    created_at: new Date().toISOString()
                };
                var result = toHtml(Funky.AuditViewer.renderTimelineItem(entry));
                expect(result).toContain('role="listitem"');
                expect(result).toContain('tabindex="0"');
                expect(result).toContain('aria-label');
            });
        });
    });

    FunkyTests.describe('View toggling', function() {
        FunkyTests.describe('setDiffView()', function() {
            FunkyTests.it('updates currentDiffView', function() {
                Funky.AuditViewer.setDiffView('unified');
                expect(Funky.AuditViewer.currentDiffView).toBe('unified');
            });

            FunkyTests.it('accepts changes view', function() {
                Funky.AuditViewer.setDiffView('changes');
                expect(Funky.AuditViewer.currentDiffView).toBe('changes');
            });

            FunkyTests.it('resets to split view', function() {
                Funky.AuditViewer.setDiffView('unified');
                Funky.AuditViewer.setDiffView('split');
                expect(Funky.AuditViewer.currentDiffView).toBe('split');
            });
        });
    });

    FunkyTests.describe('Entity history', function() {
        FunkyTests.describe('initEntityHistory()', function() {
            FunkyTests.beforeEach(function() {
                fixture.cleanup();
                fixture = FunkyTests.fixture(
                    '<div id="entityTimeline"></div>'
                );
            });

            FunkyTests.it('handles missing table name', function() {
                expect(function() {
                    Funky.AuditViewer.initEntityHistory(null, 1);
                }).not.toThrow();
            });

            FunkyTests.it('handles undefined record id', function() {
                expect(function() {
                    Funky.AuditViewer.initEntityHistory('trades', 'undefined');
                }).not.toThrow();
            });
        });

        FunkyTests.describe('renderCurrentState()', function() {
            FunkyTests.beforeEach(function() {
                fixture.cleanup();
                fixture = FunkyTests.fixture(
                    '<div id="currentStateContent"></div>'
                );
            });

            FunkyTests.it('renders state grid', function() {
                Funky.AuditViewer.renderCurrentState({ name: 'Test', value: 123 });
                var container = document.getElementById('currentStateContent');
                expect(container.innerHTML).toContain('current-state-grid');
            });

            FunkyTests.it('displays field names', function() {
                Funky.AuditViewer.renderCurrentState({ status: 'active' });
                var container = document.getElementById('currentStateContent');
                expect(container.innerHTML).toContain('Status');
            });
        });
    });

    FunkyTests.describe('Changed fields', function() {
        FunkyTests.describe('renderChangedFields()', function() {
            FunkyTests.beforeEach(function() {
                fixture.cleanup();
                fixture = FunkyTests.fixture(
                    '<div id="changedFieldsList"></div>'
                );
            });

            FunkyTests.it('renders field badges', function() {
                Funky.AuditViewer.renderChangedFields(['name', 'status']);
                var container = document.getElementById('changedFieldsList');
                expect(container.innerHTML).toContain('field-badge');
            });

            FunkyTests.it('handles empty array', function() {
                Funky.AuditViewer.renderChangedFields([]);
                var container = document.getElementById('changedFieldsList');
                expect(container.innerHTML).toContain('No specific fields');
            });

            FunkyTests.it('handles null', function() {
                Funky.AuditViewer.renderChangedFields(null);
                var container = document.getElementById('changedFieldsList');
                expect(container.innerHTML).toContain('No specific fields');
            });
        });
    });

    FunkyTests.describe('Instance management', function() {
        FunkyTests.it('has _instances registry', function() {
            expect(Funky.AuditViewer._instances).toBeDefined();
            expect(typeof Funky.AuditViewer._instances).toBe('object');
        });

        FunkyTests.describe('destroy()', function() {
            FunkyTests.it('clears data on destroy', function() {
                Funky.AuditViewer._data = [{ id: 1 }];
                Funky.AuditViewer.destroy();
                expect(Funky.AuditViewer._data.length).toBe(0);
            });

            FunkyTests.it('clears currentEntry on destroy', function() {
                Funky.AuditViewer.currentEntry = { id: 1 };
                Funky.AuditViewer.destroy();
                expect(Funky.AuditViewer.currentEntry).toBe(null);
            });
        });
    });

    FunkyTests.describe('Donut chart rendering', function() {
        FunkyTests.describe('renderDonutSegment()', function() {
            FunkyTests.it('returns empty string for zero percent', function() {
                var result = Funky.AuditViewer.renderDonutSegment(0, 0, '#ff0000');
                expect(result).toBe('');
            });

            FunkyTests.it('renders circle element', function() {
                var result = Funky.AuditViewer.renderDonutSegment(0, 50, '#ff0000');
                expect(result).toContain('<circle');
                expect(result).toContain('stroke="#ff0000"');
            });

            FunkyTests.it('applies rotation based on start percent', function() {
                var result = Funky.AuditViewer.renderDonutSegment(25, 25, '#ff0000');
                expect(result).toContain('transform="rotate(');
            });
        });
    });
});
