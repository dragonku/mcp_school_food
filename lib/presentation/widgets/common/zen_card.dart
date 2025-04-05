class ZenCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  
  const ZenCard({
    Key? key,
    required this.child,
    this.padding,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: padding ?? const EdgeInsets.all(16),
        child: child,
      ),
    );
  }
} 