import os
import io
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Required for headless server generation
from matplotlib.figure import Figure
import matplotlib.pyplot as plt
import seaborn as sns
from flask import Flask, send_file, request, jsonify, Response
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from the frontend directory
env_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env')
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app) # Allow React frontend to access API

# Connect to Supabase
url: str = os.environ.get("SUPABASE_URL", os.environ.get("VITE_SUPABASE_URL", ""))
key: str = os.environ.get("SUPABASE_KEY", os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", os.environ.get("VITE_SUPABASE_ANON_KEY", os.environ.get("VITE_SUPABASE_KEY", ""))))

if not url or not key:
    # Fallback to loading from frontend env if possible, or print warning
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not set!")
    
supabase: Client = create_client(url, key)

# Modern Dark Theme Styling for Plots to match "Midnight Aurora"
plt.style.use('dark_background')
sns.set_theme(style="darkgrid", rc={
    "axes.facecolor": "#0f172a",
    "figure.facecolor": "#0f172a",
    "grid.color": "#334155",
    "text.color": "white",
    "axes.labelcolor": "#cbd5e1",
    "xtick.color": "#94a3b8",
    "ytick.color": "#94a3b8",
    "axes.edgecolor": "#334155"
})


def format_axis_label(value, max_length=24):
    text = str(value)
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


def scoped_events_for_metric(df_events, y_feature):
    # Historical analytics should be based on completed events to avoid mixing planned and finished activity.
    if y_feature in {'total_events', 'total_participants', 'total_prize_money'}:
        return df_events[df_events['event_status'] == 'Completed'].copy()
    return df_events.copy()

def fetch_master_dataframe():
    """Fetches and flattens all relevant data into a single Pandas DataFrame for dynamic analysis."""
    # Fetch core events
    events_res = supabase.table('events').select('*, departments(department_name), categories(category_name), clubs(club_name)').execute()
    df_events = pd.DataFrame(events_res.data)
    
    # Process event columns
    df_events['department_name'] = df_events['departments'].apply(lambda x: x['department_name'] if isinstance(x, dict) else 'Unknown')
    df_events['category_name'] = df_events['categories'].apply(lambda x: x['category_name'] if isinstance(x, dict) else 'Unknown')
    df_events['club_name'] = df_events['clubs'].apply(lambda x: x['club_name'] if isinstance(x, dict) else 'None')
    df_events['event_month'] = pd.to_datetime(df_events['event_date']).dt.strftime('%Y-%m')
    df_events['organizer_unit'] = df_events.apply(
        lambda row: row['club_name']
        if row['conducted_by_type'] == 'Club'
        else row['department_name']
        if row['conducted_by_type'] == 'Department'
        else 'Unknown',
        axis=1
    )
    df_events['department_host_name'] = df_events.apply(
        lambda row: row['department_name']
        if row['conducted_by_type'] == 'Department'
        else 'Not a department event',
        axis=1
    )
    df_events['club_host_name'] = df_events.apply(
        lambda row: row['club_name']
        if row['conducted_by_type'] == 'Club'
        else 'Not a club event',
        axis=1
    )
    
    # Fetch participants and registrations
    ep_res = supabase.table('event_participants').select('event_id, participants(participant_type)').execute()
    df_ep = pd.DataFrame(ep_res.data)
    
    if not df_ep.empty:
        df_ep['participant_type'] = df_ep['participants'].apply(lambda x: x['participant_type'] if isinstance(x, dict) else 'internal')
        
        # Calculate participant counts per event
        part_counts = df_ep.groupby('event_id').size().reset_index(name='total_participants')
        df_events = df_events.merge(part_counts, on='event_id', how='left')
        df_events['total_participants'] = df_events['total_participants'].fillna(0)
    else:
        df_events['total_participants'] = 0

    # Fetch results for prize money
    results_res = supabase.table('event_results').select('event_id, prize_amount').execute()
    df_results = pd.DataFrame(results_res.data)
    if not df_results.empty:
        prize_sums = df_results.groupby('event_id')['prize_amount'].sum().reset_index(name='total_prize_money')
        df_events = df_events.merge(prize_sums, on='event_id', how='left')
        df_events['total_prize_money'] = df_events['total_prize_money'].fillna(0)
    else:
        df_events['total_prize_money'] = 0

    return df_events, df_ep

@app.route('/api/charts/dynamic', methods=['GET'])
def dynamic_chart():
    """
    Dynamic endpoint allowing the user to select X and Y axes.
    x_feature: department_host_name, category_name, club_host_name, organizer_unit, event_month, participant_type
    y_feature: total_events, total_participants, total_prize_money
    chart_type: bar, line, pie
    """
    x_feature = request.args.get('x_feature', 'organizer_unit')
    y_feature = request.args.get('y_feature', 'total_events')
    chart_type = request.args.get('chart_type', 'bar')

    df_events, df_ep = fetch_master_dataframe()
    
    # Handle participant_type specially because its grain is registrations, not events.
    if x_feature == 'participant_type':
        completed_event_ids = set(df_events[df_events['event_status'] == 'Completed']['event_id'].tolist())
        df_ep = df_ep[df_ep['event_id'].isin(completed_event_ids)] if not df_ep.empty else df_ep
        if df_ep.empty:
            return jsonify({"error": "No participant data"}), 400
        agg_df = df_ep.groupby('participant_type').size().reset_index(name='total_participants')
        agg_df = agg_df.rename(columns={'participant_type': x_feature})
        # Override y_feature since we only have counts at this grain
        y_feature = 'total_participants'
    else:
        df_events = scoped_events_for_metric(df_events, y_feature)

        if x_feature == 'department_host_name':
            df_events = df_events[df_events['conducted_by_type'] == 'Department']
        elif x_feature == 'club_host_name':
            df_events = df_events[df_events['conducted_by_type'] == 'Club']

        df_events = df_events[df_events[x_feature].notna()]
        if x_feature in {'organizer_unit', 'department_host_name', 'club_host_name', 'department_name'}:
            df_events = df_events[~df_events[x_feature].isin(['Unknown', 'None'])]

        if y_feature == 'total_events':
            agg_df = df_events.groupby(x_feature).size().reset_index(name=y_feature)
        else:
            agg_df = df_events.groupby(x_feature)[y_feature].sum().reset_index()

    # Sort for better visualization
    agg_df = agg_df.sort_values(by=y_feature, ascending=False).head(15) # Top 15 to prevent crowding
    
    # If it's a timeline, sort by time
    if x_feature == 'event_month':
        agg_df = agg_df.sort_values(by='event_month', ascending=True)

    agg_df[x_feature] = agg_df[x_feature].fillna('Unknown').astype(str)
    agg_df['display_label'] = agg_df[x_feature].apply(format_axis_label)

    use_horizontal_bar = chart_type == 'bar' and x_feature in {'organizer_unit', 'department_host_name', 'club_host_name', 'department_name'}

    # Plotting
    fig = Figure(figsize=(11, 7))
    ax = fig.subplots()
    
    colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

    if chart_type == 'bar':
        if use_horizontal_bar:
            sns.barplot(data=agg_df, y='display_label', x=y_feature, ax=ax, palette=colors, orient='h')
        else:
            sns.barplot(data=agg_df, x='display_label', y=y_feature, ax=ax, palette=colors)
            ax.tick_params(axis='x', rotation=35, labelrotation=35)
    elif chart_type == 'line':
        sns.lineplot(data=agg_df, x='display_label', y=y_feature, ax=ax, marker='o', color='#10b981', linewidth=3, markersize=8)
        ax.tick_params(axis='x', rotation=45, labelrotation=45)
        ax.fill_between(range(len(agg_df)), agg_df[y_feature], alpha=0.2, color='#10b981')
        ax.set_xticks(range(len(agg_df)))
        ax.set_xticklabels(agg_df['display_label'])
    elif chart_type == 'pie':
        ax.pie(agg_df[y_feature], labels=agg_df['display_label'], autopct='%1.1f%%', startangle=140, colors=colors)
        ax.axis('equal')
    
    # Labels and formatting
    ax.set_title(f"{y_feature.replace('_', ' ').title()} by {x_feature.replace('_', ' ').title()}", color='white', fontsize=16, pad=20)
    if chart_type != 'pie':
        if use_horizontal_bar:
            ax.set_xlabel(y_feature.replace('_', ' ').title(), fontsize=12)
            ax.set_ylabel(x_feature.replace('_', ' ').title(), fontsize=12)
        else:
            ax.set_xlabel(x_feature.replace('_', ' ').title(), fontsize=12)
            ax.set_ylabel(y_feature.replace('_', ' ').title(), fontsize=12)
    
    fig.tight_layout()

    # Save to buffer and send
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, transparent=True)
    buf.seek(0)
    
    return send_file(buf, mimetype='image/png')


@app.route('/api/export/dynamic', methods=['GET'])
def export_dynamic():
    """Returns the aggregated data as a CSV file."""
    x_feature = request.args.get('x_feature', 'organizer_unit')
    y_feature = request.args.get('y_feature', 'total_events')
    
    df_events, df_ep = fetch_master_dataframe()
    
    if x_feature == 'participant_type':
        completed_event_ids = set(df_events[df_events['event_status'] == 'Completed']['event_id'].tolist())
        df_ep = df_ep[df_ep['event_id'].isin(completed_event_ids)] if not df_ep.empty else df_ep
        if df_ep.empty:
            return jsonify({"error": "No participant data"}), 400
        agg_df = df_ep.groupby('participant_type').size().reset_index(name='total_participants')
        agg_df = agg_df.rename(columns={'participant_type': x_feature})
        y_feature = 'total_participants'
    else:
        df_events = scoped_events_for_metric(df_events, y_feature)

        if x_feature == 'department_host_name':
            df_events = df_events[df_events['conducted_by_type'] == 'Department']
        elif x_feature == 'club_host_name':
            df_events = df_events[df_events['conducted_by_type'] == 'Club']

        df_events = df_events[df_events[x_feature].notna()]
        if x_feature in {'organizer_unit', 'department_host_name', 'club_host_name', 'department_name'}:
            df_events = df_events[~df_events[x_feature].isin(['Unknown', 'None'])]

        if y_feature == 'total_events':
            agg_df = df_events.groupby(x_feature).size().reset_index(name=y_feature)
        else:
            agg_df = df_events.groupby(x_feature)[y_feature].sum().reset_index()

    agg_df = agg_df.sort_values(by=y_feature, ascending=False)
    
    # Convert DataFrame to CSV string
    csv_data = agg_df.to_csv(index=False)
    
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename=export_{x_feature}_{y_feature}.csv"}
    )

# Predefined dashboard charts
@app.route('/api/charts/dashboard_timeline', methods=['GET'])
def dashboard_timeline():
    df, _ = fetch_master_dataframe()
    agg_df = df.groupby('event_month').size().reset_index(name='events')
    agg_df = agg_df.sort_values(by='event_month', ascending=True)

    fig = Figure(figsize=(10, 4))
    ax = fig.subplots()
    sns.lineplot(data=agg_df, x='event_month', y='events', ax=ax, color='#f59e0b', linewidth=3)
    ax.fill_between(agg_df['event_month'], agg_df['events'], alpha=0.3, color='#f59e0b')
    ax.set_title("Event Timeline", color='white', pad=15)
    ax.tick_params(axis='x', rotation=45, labelrotation=45)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120, transparent=True)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@app.route('/api/charts/dashboard_categories', methods=['GET'])
def dashboard_categories():
    df, _ = fetch_master_dataframe()
    agg_df = df.groupby('category_name').size().reset_index(name='events')

    fig = Figure(figsize=(6, 6))
    ax = fig.subplots()
    colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
    ax.pie(agg_df['events'], labels=agg_df['category_name'], autopct='%1.1f%%', colors=colors, textprops={'color':"w"})
    ax.set_title("Event Categories", color='white', pad=15)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120, transparent=True)
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

if __name__ == '__main__':
    print("Starting Python Analytics Visualization API on port 5000...")
    app.run(port=5000, debug=False, use_reloader=False)
