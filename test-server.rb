#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'
require 'json'

data = []
File.read( File.dirname(__FILE__) + '/randomdata.csv').each_line do | line |
    data << line.split('|')
end

srand

get '/' do
    erb :index
end

get '/data.json' do
    content_type 'application/json'
    # pretend we only have 500 rows
    if params[:offset].to_i <= 500
        # we just ignore the offset here, becouse we're randomizing it
        {  :rows=> data.sort_by{ rand }.slice(0...params[:limit].to_i ) }.to_json 
    else
        { :rows=> [] }.to_json 
    end
end
