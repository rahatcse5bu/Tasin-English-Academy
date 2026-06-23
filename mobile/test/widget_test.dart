// Basic smoke test: the app boots and renders without throwing.
import 'package:flutter_test/flutter_test.dart';
import 'package:tasin_academy/main.dart';

void main() {
  testWidgets('App boots', (tester) async {
    await tester.pumpWidget(const TasinApp());
    await tester.pump();
    expect(find.byType(TasinApp), findsOneWidget);
  });
}
